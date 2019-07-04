const {typeUtils} = require('@wix/proto-packages');
const moduleExports = require('..');

const wellKnownTypes = {
  'google.protobuf.StringValue': {
    name: 'StringValue'
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
  if (ref.id && ref.id.startsWith('be')) {
    return {
      name: ref.name,
      namespace: 'be',
      packageName: '@wix/be-http-client'
    };
  }

  if (moduleExports[name]) {
    return {
      name: ref.name,
      packageName: '@wix/be-http-client'
    };
  };
}
