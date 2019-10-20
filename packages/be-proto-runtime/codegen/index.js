const {typeUtils} = require('./type-utils');
const moduleExports = require('..');

const wellKnownTypes = {
  'google.protobuf.StringValue': {
    name: 'StringValue'
  },
  'google.protobuf.DoubleValue': {
    name: 'DoubleValue'
  }
};

module.exports = {
  typeSource,
  getImport
};

function typeSource(messageOrEnumType) {
  const fqn = typeUtils.resolveFullyQualifiedName(messageOrEnumType);

  if (wellKnownTypes[fqn]) {
    return wellKnownTypes[fqn];
  }
}

function getImport(ref, name) {
  if (ref && ref.id && ref.id.startsWith('be')) {
    return {
      name: ref.name,
      namespace: 'be',
      packageName: '@wix/be-http-client'
    };
  }

  if (moduleExports[name]) {
    return {
      name: (ref || {}).name || name,
      packageName: '@wix/be-http-client'
    };
  };
}
