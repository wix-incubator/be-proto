const {typeUtils} = require('@wix/proto-packages');

const wellKnownTypes = {
  'google.protobuf.StringValue': {
    name: 'StringValue'
  }
};

const moduleExports = {
  double: {},
  float: {},
  int32: {},
  int64: {},
  uint32: {},
  uint64: {},
  sint32: {},
  sint64: {},
  fixed32: {},
  fixed64: {},
  sfixed32: {},
  sfixed64: {},
  bool: {},
  string: {},
  bytes: {},
  messageBuilder: {},
  be: {},
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
  if (moduleExports[name]) {
    return {
      name,
      packageName: '@wix/be-http-client'
    };
  };
}
