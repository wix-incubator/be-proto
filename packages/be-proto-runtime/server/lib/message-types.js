const {typeUtils} = require('@wix/proto-packages');
const {messageBuilder, wellKnownTypes} = require('@wix/be-http-binding');

module.exports = function messageTypes(pbContext) {
  const types = {};

  return {
    lookup(pbNodeOrType, maybeTypeName) {
      let pbType;

      if (typeof(pbNodeOrType) === 'string') {
        pbType = pbContext.lookup(pbNodeOrType)
      } else if (maybeTypeName) {
        pbType = pbNodeOrType.lookup(maybeTypeName);
      } else {
        pbType = pbNodeOrType;
      }

      const fqn = typeUtils.resolveFullyQualifiedName(pbType);

      if (!types[fqn]) {
        generateMessageTypesFor(fqn, pbType)
      }

      return types[fqn];
    }
  };

  function generateMessageTypesFor(fqn, pbType) {
    let builder = messageBuilder();

    for (let fieldName in pbType.fields) {
      const pbField = pbType.fields[fieldName];
      let fieldType;
      
      if (wellKnownTypes[pbField.type]) {
        fieldType = wellKnownTypes[pbField.type];
      } else {
        const pbFieldType = pbType.lookup(pbField.type);        
        const fqn = typeUtils.resolveFullyQualifiedName(pbFieldType);

        if (!types[fqn]) {
          generateMessageTypesFor(fqn, pbFieldType);
        }

        fieldType = types[fqn];
      }

      builder = builder.field(fieldName, fieldType, pbField.id);
    }

    types[fqn] = builder.build();
  }
};
