const pbjs = require('protobufjs');
const TrieSearch = require('trie-search');
const klaw = require('klaw-promise');
const path = require('path');
const _ = require('lodash');
const fs = require('fs-extra');
const {resolveNamespace} = require('./type-utils');
const {createTypesContext} = require('./types-context');
const debug = require('debug')('be-protobuf-idl-context');
const glob = require('glob-promise');

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

    const protoFiles = await resolveProtoRoots(contextDir, sourceRoots, packagesDirName, extraPackages);

    debug(`Resolved ${protoFiles.packages.length} packages and ${protoFiles.topLevelFiles.length} top level files files`);

    return new ResolutionRoot({
      origin: contextDir,
      protoFiles,
      packageFilesAnalyzing: analyzePackageFiles(protoFiles.packages)
    });
  }
}

async function resolveProtoRoots(contextDir, sourceRoots, packagesDirName, extraPackages = []) {
  const packages = new NpmPackages(sourceRoots, packagesDirName);
  const mainPackage = await packages.loadAt(contextDir);

  const depsSourceRoots = await mainPackage.collectAllSourceRoots();

  const extraPackagesFullPath = extraPackages.map((extraPath) => path.resolve(extraPath));

  extraPackagesFullPath.forEach((extraPackagePath) => {
    depsSourceRoots.set(extraPackagePath, new SourceRoot(null, extraPackagePath));
  });

  return ProtoFiles.from(mainPackage, depsSourceRoots, extraPackagesFullPath);
}

async function analyzePackageFiles(packageSet) {
  const beProtoPackages = {};

  await Promise.all(Array.from(packageSet).map(async(npmPackage) => {
    const pkg = npmPackage.packageJson;
    const packageDir = npmPackage.path;
    const beProtoMeta = pkg['@wix/be-proto'];

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

class ResolutionRoot extends pbjs.Root {
  constructor(opts) {
    super(opts);

    this._protoFiles = opts.protoFiles;
    this._packageFilesAnalyzing = opts.packageFilesAnalyzing;
  }

  resolvePath(origin, target) {
    if (path.isAbsolute(target)) {
      return target;
    }

    if (origin === '') {
      origin = path.resolve('.');
    }

    return this._protoFiles.forOrigin(origin, target);
  }

  async loadContext() {
    const root = await super.load(this._protoFiles.topLevelFiles);

    root.queryTypesFor = (args) => queryTypesFor(root, args);
    root.resolve = (node, name) => resolve(root, node, name);
    root.self = () => root;

    return root;
  }

  loadedFiles() {
    return this.files;
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

class NpmPackages {
  constructor(sourceRoots, packagesDirName) {
    this._sourceRoots = sourceRoots;
    this._packagesDirName = packagesDirName;
    this._allPackages = {};
  }

  async loadAt(pathToPackage) {
    if (this._allPackages[pathToPackage]) {
      return this._allPackages[pathToPackage];
    }

    const packageJson = JSON.parse(await fs.readFile(path.join(pathToPackage, 'package.json')));

    const sourceRootPaths =  this._sourceRoots.map((sourceRootPath) =>  path.join(pathToPackage, sourceRootPath));
    const existingRootPaths = await Promise.all(sourceRootPaths.filter(async(rootPath) => await fs.exists(rootPath)));

    const packageSearchPaths = [path.join(pathToPackage, this._packagesDirName)];
    let currentPath = pathToPackage;

    while (currentPath && currentPath.length > 1) {
      currentPath = path.resolve(currentPath, '..');

      if (this._allPackages[currentPath]) {
        packageSearchPaths.push(path.join(currentPath, this._packagesDirName));
      }
    }

    const depLoader = new DepLoader(this, packageSearchPaths, pathToPackage);
    const npmPackage = new NpmPackage(depLoader, pathToPackage, existingRootPaths, packageJson);

    this._allPackages[pathToPackage] = npmPackage;

    return npmPackage;
  }
}

class ProtoFiles {

  static async from(mainPackage, sourceRootsMap, implicitPackages) {
    const roots = Array.from(sourceRootsMap.values());
    const fileEntries = _.flatten(await Promise.all(
      roots.map((root) => root.protoFiles().then((files) => files.map((file) => [file, root])))));

    const filesInSourceRoots = new Map(Object.entries(_.groupBy(fileEntries, ([, root]) => root.path))
      .map(([rootPath, entries]) => [rootPath, new Set(entries.map(([{path},_]) => path))]));
    const absoluteEntries = new Map(fileEntries.map(([{absolutePath}, root]) => [absolutePath, root]));
    const {rootDeps, packages} = await ProtoFiles.resolveRootDeps(mainPackage);

    const mainPackageDeps = Array.from((await mainPackage.dependencies()).values())
    const topLevelPackages = [mainPackage].concat(mainPackageDeps);

    const topLevelFiles = _.flatten(await Promise.all(topLevelPackages.map((pkg) => pkg.protoFiles())));

    return new ProtoFiles(topLevelFiles.map(({absolutePath}) => absolutePath),
      absoluteEntries, rootDeps, filesInSourceRoots,
      packages, implicitPackages);
  }

  static async resolveRootDeps(npmPackage, rootDeps = new Map(), packages = new Set([npmPackage])) {
    const deps = await npmPackage.dependencies();
    const depPackages = Array.from(deps.values());

    deps.forEach((dep) => packages.add(dep));

    const depSourceRoots = _.flatten(depPackages.map((dep) => dep.sourceRoots.map((root) => root.path)));

    npmPackage.sourceRoots.forEach((sourceRoot) => {
      rootDeps.set(sourceRoot.path, new Set(depSourceRoots));
    });

    await Promise.all(depPackages.map((dep) => ProtoFiles.resolveRootDeps(dep, rootDeps, packages)));

    return {rootDeps, packages};
  }

  constructor(topLevelFiles, absoluteEntries, sourceRootDeps, filesInSourceRoots,
    packages, implicitPackages) {

    this._topLevelFiles = topLevelFiles;
    this._absoluteEntries = absoluteEntries;
    this._sourceRootDeps = sourceRootDeps;
    this._filesInSourceRoots = filesInSourceRoots;
    this._implicitPackages = implicitPackages;
    this._packages = packages;
  }

  get packages() {
    return this._packages;
  }

  get topLevelFiles() {
    return this._topLevelFiles;
  }

  forOrigin(protoFile, relativePath) {
    console.log('=== A', protoFile, relativePath);

    if (!protoFile.endsWith('.proto')) {
      return path.resolve(protoFile, relativePath);
    }

    const originRoot = this._absoluteEntries.get(protoFile);

    if (!originRoot) {
      throw new Error(`Could not resolve source root for ${protoFile}`);
    }

    const directDeps = this._sourceRootDeps.get(originRoot.path);

    if (!directDeps) {
      throw new Error(`Could not resolve ${relativePath} from ${protoFile}`);
    }

    const depRoots = Array.from(this._sourceRootDeps.get(originRoot.path).keys())
      .concat(this._implicitPackages);

    const foundRoot = _.find(depRoots, (root) => this._filesInSourceRoots.get(root).has(relativePath));

    if (!foundRoot) {
      throw new Error(`Could not resolve dependency matching ${relativePath}. Available deps: ${depRoots.join(',')}`);
    }

    // const deps = this._sourceRootDeps.get(root.path);

    return path.resolve(foundRoot, relativePath);
  }
}

class DepLoader {
  constructor(packages, searchPaths, contextPath) {
    this._contextPath = contextPath;
    this._packages = packages;
    this._searchPaths = searchPaths;
  }

  loadPackage(name) {
    const searchPaths = this._searchPaths.slice();

    return this._loadPackage(searchPaths, name);
  }

  async _loadPackage(searchPaths, name) {
    const searchPath = searchPaths.shift();

    const packagePath = path.join(searchPath, name);

    if (await fs.exists(packagePath)) {
      return this._packages.loadAt(packagePath);
    }

    if (searchPaths.length > 0) {
      return this._loadPackage(searchPaths, name);
    }

    throw new Error(`Could not load package ${name} from context ${this._contextPath}`)
  }
}

class NpmPackage {

  constructor(depLoader, path, sourceRoots, packageJson) {
    this._depLoader = depLoader;
    this._path = path;
    this._sourceRoots = sourceRoots.map((rootPath) => new SourceRoot(this, rootPath));
    this._packageJson = packageJson;
    this._deps = Object.keys(
      Object.assign(packageJson.devDependencies || {}, packageJson.peerDependencies || {}, packageJson.dependencies || {}));
    this._loadingDeps = {};
  }

  get path() {
    return this._path;
  }

  get packageJson() {
    return this._packageJson;
  }

  get sourceRoots() {
    return this._sourceRoots;
  }

  async protoFiles() {
    return _.flatten(await Promise.all(this._sourceRoots.map((root) => root.protoFiles())));
  }

  async dependencies() {
    return new Map(await Promise.all(this._deps.map((dep) => this._loadPackage(dep).then((pkg) => [dep, pkg]))));
  }

  async collectAllSourceRoots() {
    const directRoots = new Map();

    this._sourceRoots.forEach((root) => {
      directRoots.set(root.path, root);
    });

    const deps = Array.from((await this.dependencies()).values());
    const sourceRootMaps = await Promise.all(deps.map((pkg) => pkg.collectAllSourceRoots()));

    sourceRootMaps.unshift(directRoots);

    return sourceRootMaps.reduce((map1, map2) =>
      new Map([...map1, ...map2])
    );
  }

  async _loadPackage(name) {
    if (!this._loadingDeps[name]) {
      this._loadingDeps[name] = this._depLoader.loadPackage(name);
    }

    return this._loadingDeps[name];
  }
}

class SourceRoot {

  constructor(pkg, path) {
    this._package = pkg;
    this._path = path;
    this._protofilesLoading = null;
  }

  get path() {
    return this._path;
  }

  get package() {
    return this._package;
  }

  async protoFiles() {
    if (this._protofilesLoading) {
      return this._protofilesLoading;
    }

    const files = await glob('**/*.proto', {
      cwd: this._path
    });

    return files.map((relPath) => ({
      path: relPath,
      absolutePath: path.resolve(this._path, relPath)
    }));
  }
}

module.exports = {
  create
};
