const {generateType} = require('./message-generator');
const {generateMethod} = require('./http-method-generator');

function httpClientGen(context) {
  return {
    async generate(typeNames, output) {
      try {
        const types = await context.queryTypesFor(typeNames);

        await Promise.all(types.map(async(type) => {
          const descriptors = await formatDescriptors(context, type);

          descriptors.forEach((desc) =>
            output.add({
              namespace: desc.namespace,
              name: desc.name,
              js: {
                imports: desc.js.imports,
                code: desc.js.code
              }
          }));
        }));

        output.complete();
      } catch(e) {
        output.error(e);
      }
    }
  };
}

async function formatDescriptors(context, type) {
  const messageDesc = generateType(type);

  if (messageDesc) {
    const code = formatMessageCode(type, messageDesc);
    const imports = await mapImports(context, messageDesc);

    return [{
      namespace: messageDesc.namespace,
      name: messageDesc.name,
      js: {
        code,
        imports
      }
    }];
  } else {
    return Promise.all(Object.keys(type.methods).map(async(methodName) => {
      const method = type.methods[methodName];
      const methodDesc = generateMethod(method);
      const code = formatMethodCode(methodDesc);
      const imports = await mapImports(context, methodDesc);

      return {
        namespace: methodDesc.namespace,
        name: methodDesc.name,
        js: {
          code,
          imports
        }
      }
    }));
  }
}

function formatMessageCode(type, messageDesc) {
  return `module.exports = {
      get ${type.name}: lazy(() => ${messageDesc.js.code}.build())
    }`;
}

function formatMethodCode(methodDesc) {
  return `module.exports = {
    get ${methodDesc.name}: lazy(() => ${methodDesc.js.code})
  }`
}

function mapImports(context, desc) {
  const refs = desc.js.refs || {};

  return Promise.all(Object.keys(refs).map((name) => mapImport(context, name, refs[name])));
}

async function mapImport(context, name, ref) {
  if (ref.source && !builtinTypes[name]) {
    return mapLocalImport(await context.resolve(ref.source, ref.id));
  } else {
    return {
      name,
      packageName: '@wix/be-http-client'
    };
  }
}

function mapLocalImport({namespace, name, exports}) {
  if (exports) {
    const exportedBy = Object.keys(exports)[0];

    if (exportedBy) {
      const {pathInPackage} = exports[exportedBy];

      return {
        name,
        packageName: `${exportedBy}/${pathInPackage}/${namespace}/${name}`
      };
    }
  }

  return {
    namespace,
    name
  };
}

const builtinTypes = {
  string: {}
};

module.exports = {httpClientGen, mapImport, mapLocalImport};
