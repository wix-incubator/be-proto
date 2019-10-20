const _ = require('lodash');
const typeUtils = require('./type-utils');

module.exports = {
  createTypesContext
};

function typesContext(typeDescriptors) {

  const types = typeDescriptors.map(({node}) => node);

  return {
    types,
    resolveCycleGroups() {
      const cyclesIndex = {};

      typeDescriptors.forEach((typeDesc) => {
        const foundInTypes = findTypeIn(typeDesc.node, typeDesc.deps);

        if (!cyclesIndex[typeDesc.node]) {
          cyclesIndex[typeDesc.node] = [typeDesc.node];
        }

        foundInTypes.forEach((type) => {
          cyclesIndex[typeDesc.node].push(type);
        });
      });

      return collectCycles(cyclesIndex);
    }
  };
}

function collectCycles(cyclesIndex) {
  const cycles = [];
  const cycleTypes = Object.keys(cyclesIndex);

  cycleTypes.forEach((type) => {
    let cyclesOfType = cyclesIndex[type];

    // console.log('= B', type, cyclesOfType);

    if (!cyclesOfType) {
      return;
    }

    cycles.push(reduceCyclesFor(type, cyclesIndex));
  });

  return cycles;
}

function reduceCyclesFor(type, cyclesIndex) {
  let cycles = [];
  const cyclesOfType = cyclesIndex[type];

  if (!cyclesIndex[type]) {
    return cycles;
  }

  delete cyclesIndex[type];

  cyclesOfType.forEach((typeInCycle) => {
    cycles.push(typeInCycle);
    cycles = cycles.concat(reduceCyclesFor(typeInCycle, cyclesIndex))
  });

  return _.uniq(cycles);
}

function findTypeIn(typeToFind, typeDescriptors, visited = {}) {
  return _.flatten(typeDescriptors.map(({node, deps}) => {
    if (visited[node]) {
      return [];
    }

    visited[node] = true;

    const depTypes = deps.map(({node}) => node);

    const foundInSubDeps = _.flatten(deps.map(({deps: subdeps}) => findTypeIn(typeToFind, subdeps, visited)));

    return depTypes.indexOf(typeToFind) >= 0 ? foundInSubDeps.concat([node]) : foundInSubDeps;
  }));
}

function createTypesContext(loadedContext, types) {
  const index = {}

  types.forEach(type => {
    addToIndex(type, index);
  });

  collectDependencies(loadedContext, indexedTypesFrom(index), index);

  return typesContext(Object.values(index));
}

function collectDependencies(root, types, index) {
  if (types.length === 0) {
    return;
  }

  let deps = [];

  types.forEach(type => {
    deps = deps.concat(typeDepsFor(type, index));
  });

  collectDependencies(root, deps, index);
}


function typeDepsFor(type, index = {}) {
  const deps = [];

  typeDepsFromMethods(type, index, deps);
  typeDepsFromFields(type, index, deps);

  return _.uniq(deps);
}

function typeDepsFromMethods(type, index, deps) {
  if (!type.methods) {
    return;
  }

  Object.keys(type.methods).forEach(methodName => {
    const method = type.methods[methodName];

    const requestType = type.lookupType(method.requestType);
    const responseType = type.lookupType(method.responseType);

    addToIndex(requestType, index, type);
    addToIndex(responseType, index, type);

    typeDepsFromFields(requestType, index, deps);
    typeDepsFromFields(responseType, index, deps);
  });
}

function typeDepsFromFields(type, index, deps) {

  if (!type.fields) {
    return;
  }

  Object.keys(type.fields).forEach(fieldName => {
    const {type: fieldTypeName} = type.fields[fieldName];
    const fieldType = type.lookup(fieldTypeName);

    if (addToIndex(fieldType, index, type)) {
      deps.push(fieldType);
    }
  });
}

function addToIndex(node, index, dependee) {
  if (!node) {
    return false;
  }

  const fqn = typeUtils.resolveFullyQualifiedName(node);

  let added = false;

  if (!index[fqn]) {
    index[fqn] = {
      node,
      deps: []
    };

    added = true;
  }

  if (dependee && dependee !== node) {
    const dependeeFqn = typeUtils.resolveFullyQualifiedName(dependee);

    index[dependeeFqn].deps.push(index[fqn]);
  }

  return added;
}

function indexedTypesFrom(index) {
  return Object.values(index).map(({node}) => node);
}