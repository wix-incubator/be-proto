
module.exports = {
  generateMessageUnit(messageType) {
    const jsRefs = {};
    const {jsFields} = formatMessageFields(messageType.fields, jsRefs);

    const fnCode = `
      function define() {
        const type = ${reference('MessageBuilder', 'be-proto:runtime', jsRefs)}.create()
          ${jsFields};
      }
    `;

    return {
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
};

function formatMessageFields(fields, jsRefs) {
  const jsFields = [];

  Object.values(fields).forEach((field) => {
    const fieldMethod = field.repeated ? 'repeated' : 'field';
    const fieldModifier = field.partOf ? `${reference('oneOf', 'be-proto:runtime', jsRefs)}('${field.partOf.name}', ${field.id})` : field.id;

    jsFields.push(`.${fieldMethod}('${field.name}', ${reference(field.type, 'be-proto:runtime', jsRefs)}, ${fieldModifier})`);
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
