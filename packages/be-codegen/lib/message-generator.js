const {typeUtils} = require('@wix/proto-packages');
const reference = require('./reference');

module.exports = {
  generateMessageUnit,
  generateEnum,
  generateType,
  generateTypes
};

function generateTypes(types) {
  const jsRefs = {};
  const generated = types.map((type) => generateType(type, jsRefs)).filter((desc) => desc);
  const exports = {};

  generated.forEach(({name, messageType, js}) => {
    exports[name] = {
      messageType,
      js
    };
  });

  pruneLocalImports(jsRefs, types);

  return {
    namespace: generated.length > 0 ? generated[0].namespace: undefined,
    exports,
    js: {
      refs: jsRefs
    }
  };
}

function pruneLocalImports(jsRefs, messageOrEnumTypes) {
  const fqn = messageOrEnumTypes.map((type) => typeUtils.resolveFullyQualifiedName(type));

  Object.keys(jsRefs).forEach((refName) => {
    if (jsRefs[refName].source) {
      const refType = jsRefs[refName].source.lookup(refName);

      if (refType) {
        const refTypeName = typeUtils.resolveFullyQualifiedName(refType);

        if (fqn.indexOf(refTypeName) >= 0) {
          delete jsRefs[refName];
        }
      }
    }
  });
}

function generateType(messageOrEnumType, jsRefs = {}) {
  if (messageOrEnumType.fields) {
    return generateMessageUnit(messageOrEnumType, jsRefs);
  } else if (messageOrEnumType.values) {
    return generateEnum(messageOrEnumType, jsRefs);
  }
}

function generateMessageUnit(messageType, jsRefs = {}) {
  const {jsFields} = formatMessageFields(messageType, jsRefs);

  const fnCode = `${reference('messageBuilder', null, jsRefs)}()\r\n${jsFields}`;

  return {
    name: messageType.name,
    namespace: typeUtils.resolveNamespace(messageType),
    nested: collectNestedTypes(messageType),
    messageType,
    js: {
      refs: jsRefs,
      code: fnCode
    },
    ts: {
      refs: [],
      code: ``
    }
  };
}

function generateEnum(enumType, jsRefs = {}) {
  const {jsFields} = formatEnumFields(enumType.values);

  const fnCode = `${reference('EnumBuilder', null, jsRefs)}.create()${jsFields}`;

  return {
    name: enumType.name,
    namespace: typeUtils.resolveNamespace(enumType),
    enumType,
    js: {
      refs: jsRefs,
      code: fnCode
    },
    ts: {
      refs: [],
      code: ``
    }
  };
}

function collectNestedTypes(node) {
  if (!node.nested) {
    return undefined;
  }

  const nested = {};

  Object.keys(node.nested).forEach((name) => {
    const child = node.nested[name];

    nested[name] = generateType(child);
  });

  return nested;
}

function formatMessageFields(messageType, jsRefs) {
  const jsFields = [];

  Object.values(messageType.fields).forEach((field) => {
    const fieldMethod = field.repeated ? 'repeated' : 'field';
    const fieldModifier = field.partOf ? `${reference('oneOf', null, jsRefs)}('${field.partOf.name}', ${field.id})` : field.id;

    const source = messageType;

    jsFields.push(`.${fieldMethod}('${field.name}', ${reference(field.type, source, jsRefs)}, ${fieldModifier})`);
  });

  return {
    jsFields: jsFields.join('\r\n')
  };
}

function formatEnumFields(values) {
  const jsFields = [];

  Object.keys(values).forEach((name) => {
    const value = typeof(values[name]) === 'string' ? `'${values[name]}'` : values[name];

    jsFields.push(`.value('${name}', ${value})`);
  });

  return {
    jsFields: jsFields.join('\r\n')
  };
}
