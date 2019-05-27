const pbjs = require('protobufjs');
const TrieSearch = require('trie-search');
const klaw = require('klaw-promise');
const path = require('path');
const _ = require('lodash');
const fs = require('fs-extra');
const {resolveNamespace} = require('./type-utils');

function create(options) {

  const contextDir = options.contextDir;
  const sourceRoots = options.sourceRoots || ['proto'];
  const extraPackages = options.extraPackages || [];
  const packagesDirName = options.packagesDirName || 'node_modules';

  let rootResolving, context;

  return {
    lookupType: readyContextMethod((context) => context.lookupType),
    protoFiles: readyContextMethod((context) => context.protoFiles),
    queryTypesFor: readyContextMethod((context) => context.queryTypesFor),
    resolve: readyContextMethod((context) => context.resolve),
    files: readyContextMethod((context) => context.loadedFiles)
  };

  function readyContextMethod(getMethod) {
    return async function() {
      if (!context) {
        if (!rootResolving) {
          rootResolving = resolveRoot();
        }

        const resolutionRoot = await rootResolving;

        context = await resolutionRoot.loadContext();
      }

      return getMethod(context).apply(context, arguments);
    }
  }

  async function resolveRoot() {
    const {roots, packageFiles} = await resolveProtoRoots(contextDir, sourceRoots, packagesDirName, extraPackages);

    return new ResolutionRoot({
      origin: contextDir,
      roots,
      packageFilesAnalyzing: analyzePackageFiles(packageFiles)
    });
  }
}

async function resolveProtoRoots(contextDir, sourceRoots, packagesDirName, extraPackages  ) {
  const result = await klaw(contextDir, { preserveSymlinks: true });

  const protoFiles = [];
  const packageFiles = [];
  const packageDirs = extraPackages;
  const links = [];
  const origin = contextDir;

  await collectProtofilesTo(extraPackages, protoFiles);

  result.forEach(fs => {
    if (fs.stats.isSymbolicLink()) {
      links.push(fs.path);
    } else if (fs.path.toLowerCase().endsWith('.proto')) {
      protoFiles.push({
        path: fs.path
      });
    } else if (path.basename(fs.path) === 'package.json') {
      packageFiles.push(fs.path);
      packageDirs.push(path.dirname(fs.path));
    }
  });

  const ts = new TrieSearch('path', {splitOnRegEx: /\\/});

  ts.addAll(protoFiles);

  const existingRoots = (await resolveProtoDirs(packageDirs, sourceRoots)).concat(extraPackages);

  const roots = {};

  roots[origin] = _.filter(ts.get(origin).map((entry) => path.relative(origin, entry.path)), entry =>
    !belongsTo(entry, [packagesDirName]) && belongsTo(entry, sourceRoots));

  existingRoots.forEach(root => {
    roots[root] = ts.get(root).map((entry) => path.relative(root, entry.path));
  });

  return {roots, packageFiles};
}

async function collectProtofilesTo(dirs, protoFiles) {
  await Promise.all(dirs.map(async(dir) => {
    const result = await klaw(dir, { preserveSymlinks: false });

    result.forEach(fs => {
      if (fs.path.toLowerCase().endsWith('.proto')) {
        protoFiles.push({
          path: fs.path
        });
      }
    });
  }));
}

async function analyzePackageFiles(packageFiles) {
  const beProtoPackages = {};

  await Promise.all(packageFiles.map(async(packageFile) => {
    const pkg = JSON.parse(await fs.readFile(packageFile));
    const beProtoMeta = pkg['@wix/be-proto'];
    const packageDir = path.dirname(packageFile);

    if (beProtoMeta) {
      const beProtoDirs = Array.isArray(beProtoMeta.exports) ? beProtoMeta.exports : [beProtoMeta.exports];

      const existingFiles = (await Promise.all(beProtoDirs.map((dir) => path.join(packageDir, dir, 'be-proto.json')).map((filepath) =>
        fs.exists(filepath).then((result) => result ? filepath : null)))).filter((path) => path);

      const exports = await Promise.all(existingFiles.map(async(filepath) => ({
        pathInPackage: path.relative(packageDir, path.dirname(filepath)),
        metadata: JSON.parse(await fs.readFile(filepath)),
      })));

      beProtoPackages[pkg.name] = {
        exports,
        packageInfo: pkg
      };
    }
  }));

  return beProtoPackages;
}

async function resolveProtoDirs(packageDirs, sourceRoots) {
  const protoRoots = _.flatMap(packageDirs, (dir) => sourceRoots.map(rootPath => path.resolve(dir, rootPath)));

  return (await Promise.all(protoRoots.map(root => fs.exists(root).then(exists => [root, exists]))))
    .filter(([_, exists]) => exists).map(([path, _]) => path);
}

function belongsTo(filepath, roots) {
  return _.find(roots, root => filepath.startsWith(root)) !== undefined;
}

class ResolutionRoot extends pbjs.Root {

  constructor(opts) {
    super(opts);

    const targets = {};

    for (let root in opts.roots) {
      opts.roots[root].forEach(target => {
        if (targets[target]) {
          return;
        }

        targets[target] = path.resolve(root, target);
      });
    }

    this._roots = opts.roots;

    _.uniq(targets);

    this._targets = targets;
    this._reverseTargets = _.invert(targets);
    this._packageFilesAnalyzing = opts.packageFilesAnalyzing;
  }

  async loadContext() {
    const root = await super.load(this.protoFiles());

    root.queryTypesFor = (args) => queryTypesFor(root, args);
    root.resolve = (node, name) => resolve(root, node, name);

    return root;
  }

  protoFiles() {
    return Object.values(this._targets);
  }

  loadedFiles() {
    return this.files;
  }

  resolveContextPath(filename) {
    return this._reverseTargets[filename];
  }

  resolvePath(origin, target) {
    if (this._targets[target]) {
      return this._targets[target];
    }

    if (origin.endsWith('.proto')) {
      return path.resolve(path.dirname(origin), target);
    } else {
      return path.resolve(origin, target);
    }
  }

  async exportsFor(namespace, name) {
    const exportsByTypes = await this.resolveExports();
    const exportedMeta = exportsByTypes[`${namespace}.${name}`];

    if (!exportedMeta) {
      return {};
    }

    const {packageName, target} = exportedMeta;

    return {
      [packageName]: {
        target,
        pathInPackage: exportedMeta.pathInPackage
      }
    };
  }

  async resolveExports() {
    if (this._exportsByTypes) {
      return this._exportsByTypes;
    }

    const exports = await this._packageFilesAnalyzing;
    const exportsByTypes = {};

    Object.keys(exports).forEach((packageName) => {
      const mainFile = exports[packageName].packageInfo.main || 'index.js';

      exports[packageName].exports.forEach(({metadata, pathInPackage}) => {
        Object.keys(metadata).forEach((targetName) => {
          const types = metadata[targetName];

          types.forEach(typeName => {
            exportsByTypes[typeName] = {
              target: targetName,
              packageName,
              pathInPackage: path.relative(path.dirname(mainFile), pathInPackage)
            };
          });
        });
      });
    });

    this._exportsByTypes = exportsByTypes;

    return this._exportsByTypes;
  }
}

function queryTypesFor(root, typeNames) {
  const index = {}

  typeNames.forEach(typeName => {
    // console.log(typeName, root.lookup(typeName));

    index[typeName] = root.lookup(typeName);
  });

  collectDependencies(root, Object.values(index), index);

  return Object.values(index);
}

async function resolve(root, node, name) {
  const type = node.lookup(name);

  if (!type) {
    throw new Error(`Unknown type "${name}"`);
  }

  const namespace = resolveNamespace(type);

  return {
    name: type.name,
    namespace,
    fullyQualifiedName: `${namespace}.${type.name}`,
    exports: await root.exportsFor(namespace, type.name)
  };
}

function collectDependencies(root, types, index) {
  if (types.length === 0) {
    return;
  }

  const deps = [];

  types.forEach(type => {
    deps.concat(typeDepsFor(root, type, index));
  });

  collectDependencies(root, deps, index);
}

function collectFileDependencies(root, typeSets, index) {
  console.log(root.getFiles());

  if (typeSets.length === 0) {
    return;
  }

  const deps = [];

  typeSets.forEach(types => {
    const typeDeps = _.uniq(_.flatten(types.map(type => typeDepsFor(root, type))));

    typeDeps.forEach(type => {
      deps.concat(addFileDepsToIndex(type.parent, type.filename, index));
    });
  });

  collectFileDependencies(root, deps, index);
}

function typeDepsFor(root, type, index = {}) {
  const deps = [];

  typeDepsFromMethods(root, type, index, deps);
  typeDepsFromFields(root, type, index, deps);

  return _.uniq(deps);
}

function typeDepsFromMethods(root, type, index, deps) {
  if (!type.methods) {
    return;
  }

  Object.keys(type.methods).forEach(methodName => {
    const method = type.methods[methodName];

    const requestType = root.lookupType(method.requestType);
    const responseType = root.lookupType(method.responseType);

    // FIXME must be fully qualified names
    index[method.requestType] = requestType;
    index[method.responseType] = responseType;

    typeDepsFromFields(root, requestType, index, deps);
    typeDepsFromFields(root, responseType, index, deps);
  });
}

function typeDepsFromFields(root, type, index, deps) {
  if (!type.fields) {
    return;
  }

  Object.keys(type.fields).forEach(fieldName => {
    const {type: fieldTypeName} = type.fields[fieldName];

    if (!index[fieldTypeName]) {
      try {
        const fieldType = root.lookupType(fieldTypeName);

        if (fieldType) {
          index[fieldTypeName] = fieldType;
          deps.push(fieldType);
        }
      } catch(e) {
      }
    }
  });
}

function addFileDepsToIndex(namespace, filename, index) {
  if (filename && !index[filename]) {
    index[filename] = _.filter(namespace.nested, (nested) => nested.filename === filename);
    return index[filename];
  } else {
    return [];
  }
}

module.exports = {
  create
};
