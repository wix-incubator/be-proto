const {generateType} = require('./message-generator');

function httpClientGen(context) {
  return {
    async generate(typeNames, output) {
      try {
        const types = await context.queryTypesFor(typeNames);

        types.map(async(type) => {
          const messageDesc = generateType(type);

          const messageCode = `
          module.exports = {
            get ${type.name}: lazy(() => define${type.name}())
          }

          function define${type.name}() {
            ${messageDesc.js.code}
            .build()
          }`

          const imports = await mapImports(context, messageDesc);

          output.add({
            namespace: messageDesc.namespace,
            name: messageDesc.name,
            js: {
              imports,
              code: messageCode
            }
          });
        });

        output.complete();
      } catch(e) {
        output.error(e);
      }
    }
  };
}

function mapImports(context, desc) {
  const refs = desc.js.refs || {};

  return Promise.all(Object.keys(refs).map((name) => mapImport(context, name, refs[name])));
}

async function mapImport(context, name, ref) {
  if (ref.source && !builtinTypes[name]) {
    const {namespace, name} = await context.resolveName(ref.source, ref.id);

    return {
      name,
      namespace
    };
  } else {
    return {
      name,
      packageName: '@wix/be-http-client'
    };
  }
}

const builtinTypes = {
  string: {}
};

module.exports = {httpClientGen, mapImports};
