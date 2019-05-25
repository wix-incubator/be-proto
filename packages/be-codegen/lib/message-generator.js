const protobuf = require('protobufjs');

module.exports = {
  generateMessageUnit,
  generateEnum,
  generateType
};

function generateType(messageOrEnumType) {
  if (messageOrEnumType.fields) {
    return generateMessageUnit(messageOrEnumType);
  } else if (messageOrEnumType.values) {
    return generateEnum(messageOrEnumType);
  }
}

function generateMessageUnit(messageType) {
  const jsRefs = {};
  const {jsFields} = formatMessageFields(messageType, jsRefs);

  const fnCode = `${reference('MessageBuilder', null, jsRefs)}.create()\r\n${jsFields};`;

  return {
    name: messageType.name,
    namespace: resolveNamespace(messageType),
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

function generateEnum(enumType) {
  const jsRefs = {};
  const {jsFields} = formatEnumFields(enumType.values);

  const fnCode = `${reference('EnumBuilder', null, jsRefs)}.create()${jsFields};`;

  return {
    name: enumType.name,
    namespace: resolveNamespace(enumType),
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

function reference(id, source, refs) {
  refs[id] = {
    id,
    source
  };

  return id;
}

function resolveNamespace(node) {
  const namespace = collectNamespace(node);

  return namespace.length === 0 ? undefined : namespace.join('.');
}

function collectNamespace(node, namespace = []) {
  const parent = node.parent;

  if (parent) {
    if (parent.name > '') {
      namespace.unshift(parent.name);
    }

    resolveNamespace(parent, namespace);
  }

  return namespace;
}
