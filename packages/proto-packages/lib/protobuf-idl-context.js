const pbjs = require('protobufjs');
const TrieSearch = require('trie-search');
const klaw = require('klaw-promise');
const path = require('path');
const _ = require('lodash');
const fs = require('fs-extra');
const {resolveNamespace} = require('./type-utils');
const {createTypesContext} = require('./types-context');
const debug = require('debug')('be-protobuf-idl-context');

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
    files: readyContextMethod((context) => context.loadedFiles),
    loadedContext: readyContextMethod((context) => context.self)
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
    debug('Resolving root', contextDir, sourceRoots, packagesDirName, extraPackages);

    const {roots, packageFiles} = await resolveProtoRoots(contextDir, sourceRoots, packagesDirName, extraPackages);

    debug(`Resolved ${Object.keys(roots).length} roots and ${packageFiles.length} package files`);

    return new ResolutionRoot({
      origin: contextDir,
      roots,
      packageFilesAnalyzing: analyzePackageFiles(packageFiles)
    });
  }
}

async function resolveProtoRoots(contextDir, sourceRoots, packagesDirName, extraPackages = []) {
  const result = await klaw(contextDir, { preserveSymlinks: true });

  debug(`Finished traverse`);

  extraPackages = extraPackages.map((packagePath) => path.resolve(packagePath));

  const protoFiles = [];
  const packageFiles = [];
  const packageDirs = extraPackages.slice();
  const links = [];

  await collectProtofilesTo(packageDirs, protoFiles);

  const currentDir = path.resolve(contextDir);

  result.forEach(node => {
    if (node.stats.isSymbolicLink() && node.path !== currentDir) {
      links.push(node.path);
    } else if (node.path.toLowerCase().endsWith('.proto')) {
      protoFiles.push({
        path: node.path
      });
    } else if (path.basename(node.path) === 'package.json') {
      packageFiles.push(node.path);
      packageDirs.push(path.dirname(node.path));
    }
  });

  debug(`Found ${links.length} symlinks, resolving`);

  const resolvingFromLinks = Promise.all(links.map(async(link) => resolveProtoRoots(await fs.realpath(link), sourceRoots, packagesDirName)));

  const ts = new TrieSearch('path', {splitOnRegEx: /\\/});

  ts.addAll(protoFiles);

  debug(`Resolving proto directories`);

  const existingRoots = (await resolveProtoDirs(packageDirs, sourceRoots)).concat(extraPackages);

  debug(`Finished resolving proto directories`);

  const roots = {};

  roots[contextDir] = _.filter(ts.get(contextDir).map((entry) => path.relative(contextDir, entry.path)), entry =>
    !belongsTo(entry, [packagesDirName]) && belongsTo(entry, sourceRoots));

  existingRoots.forEach(root => {
    roots[root] = ts.get(root).map((entry) => path.relative(root, entry.path));
  });

  const fromLinks = await resolvingFromLinks;

  debug(`Finished resolving symlinks`);

  fromLinks.forEach((rootsFromLinks) => {
    for (let root in rootsFromLinks.roots) {
      roots[root] = rootsFromLinks.roots[root];
    }

    rootsFromLinks.packageFiles.forEach((packageFile) => packageFiles.push(packageFile));
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
    root.self = () => root;

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
  return createTypesContext(root, typeNames.map((typeName) => root.lookup(typeName)));
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

function collectFileDependencies(root, typeSets, index) {
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
