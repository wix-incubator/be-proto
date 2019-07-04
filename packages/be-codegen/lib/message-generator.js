const {typeUtils} = require('@wix/proto-packages');
const codeReferences = require('./code-references');
const {typeSource} = require('@wix/be-http-client/codegen');

module.exports = {
  generateMessageUnit,
  generateEnum,
  generateType,
  generateTypes
};

function generateTypes(types) {
  const refs = codeReferences(types);
  const generated = types.map((type) => generateType(type, refs)).filter((desc) => desc);
  const exports = {};

  generated.forEach(({name, messageType, js, ts}) => {
    exports[name] = {
      messageType,
      js,
      ts
    };
  });

  return {
    namespace: generated.length > 0 ? generated[0].namespace: undefined,
    exports,
    js: {
      refs: refs.jsRefs
    },
    ts: {
      refs: refs.tsRefs
    }
  };
}

function generateType(messageOrEnumType, refs = codeReferences([messageOrEnumType])) {
  const managedType = typeSource(messageOrEnumType);

  if (managedType) {
    return generateReexport(messageOrEnumType, managedType, refs);
  } else if (messageOrEnumType.fields) {
    return generateMessageUnit(messageOrEnumType, refs);
  } else if (messageOrEnumType.values) {
    return generateEnum(messageOrEnumType, refs);
  }
}

function generateMessageUnit(messageType, refs = codeReferences([messageType])) {
  const {jsFields, tsFields} = formatMessageFields(messageType, refs);

  const jsCode = `${refs.jsReference('messageBuilder')}()\r\n${jsFields}.build()`;
  const tsCode = `abstract class ${messageType.name} extends ${refs.tsReference('be.Message')}\r\n { ${tsFields}\r\n }`;

  return {
    name: messageType.name,
    namespace: typeUtils.resolveNamespace(messageType),
    nested: collectNestedTypes(messageType),
    messageType,
    js: {
      refs: refs.jsRefs,
      code: jsCode
    },
    ts: {
      refs: refs.tsRefs,
      code: tsCode
    }
  };
}

function generateReexport(messageOrEnumType, metadata, refs) {
  const jsCode = `${refs.jsReference(metadata.name)}`;
  const tsCode = `${refs.tsReference(messageOrEnumType.name)}`;

  return {
    name: messageOrEnumType.name,
    namespace: typeUtils.resolveNamespace(messageOrEnumType),
    nested: collectNestedTypes(messageOrEnumType),
    messageOrEnumType,
    js: {
      refs: refs.jsRefs,
      code: jsCode
    },
    ts: {
      refs: refs.tsRefs,
      code: tsCode
    }
  };
}

function generateEnum(enumType, refs = codeReferences([enumType])) {
  const {jsFields} = formatEnumFields(enumType.values);

  const fnCode = `${refs.jsReference('EnumBuilder')}.create()${jsFields}.build()`;

  return {
    name: enumType.name,
    namespace: typeUtils.resolveNamespace(enumType),
    enumType,
    js: {
      refs: refs.jsRefs,
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

function formatMessageFields(messageType, refs) {
  const jsFields = [];
  const tsFields = [];

  Object.values(messageType.fields).forEach((field) => {
    const jsFieldMethod = field.repeated ? 'repeated' : 'field';
    const jsFieldModifier = field.partOf ? `${refs.jsReference('oneOf')}('${field.partOf.name}', ${field.id})` : field.id;

    jsFields.push(`.${jsFieldMethod}('${field.name}', ${refs.jsReference(field.type, messageType)}, ${jsFieldModifier})`);
    tsFields.push(`${field.name}${field.partOf ? '?' : ''}: ${refs.tsReference(field.type, messageType)}${field.repeated ? '[]' : ''}`);
  });

  return {
    jsFields: jsFields.join('\r\n'),
    tsFields: tsFields.join('\r\n')
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
