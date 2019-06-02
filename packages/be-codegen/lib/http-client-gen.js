const {generateTypes} = require('./message-generator');
const {generateMethod} = require('./http-method-generator');
const _ = require('lodash');

function httpClientGen(context) {
  return {
    async generate(typeNames, output) {
      try {
        const {resolveCycleGroups} = await context.queryTypesFor(typeNames);
        const exportedTypes = [];

        const cycleGroups = resolveCycleGroups();

        await Promise.all(cycleGroups.map(async(typesInGroup) => {
          const descriptors = await formatDescriptors(context, typesInGroup);

          descriptors.forEach((desc) => {
            exportedTypes.push(formatTypeName(desc));

            output.add({
              namespace: desc.namespace,
              name: desc.name,
              js: {
                imports: desc.js.imports,
                code: desc.js.code
              },
              ts: {
                imports: desc.ts.imports,
                code: desc.ts.code
              }
            });
          });
        }));

        output.add({
          name: 'be-proto',
          json: {
            '@wix/be-http-client': exportedTypes
          }
        });

        output.complete();
      } catch(e) {
        console.error(e);
        output.error(e);
      }
    }
  };
}

async function formatDescriptors(context, types) {
  const messageDescriptors = generateTypes(types);
  const methods = _.flatten(types.filter(({methods}) => methods).map((type) => Object.values(type.methods)));

  let descriptors = [];

  const typeNamesToExport = Object.keys(messageDescriptors.exports);
  const numTypesToExport = typeNamesToExport.length;

  if (numTypesToExport > 0) {
    const name = numTypesToExport > 1 ? `agg_${typeNamesToExport.join('_')}` : typeNamesToExport[0];

    const {jsCode, tsCode} = formatMessagesCode(messageDescriptors);

    descriptors = descriptors.concat([{
      namespace: messageDescriptors.namespace,
      name,
      js: {
        code: jsCode,
        imports: await mapImports(context, messageDescriptors.js.refs)
      },
      ts: {
        code: tsCode,
        imports: await mapImports(context, messageDescriptors.ts.refs)
      }
    }]);
  }

  descriptors = descriptors.concat(await Promise.all(methods.map(async(method) => {
    const methodDesc = generateMethod(method);
    const {jsCode, tsCode} = formatMethodCode(methodDesc);
    const imports = await mapImports(context, methodDesc);

    return {
      namespace: methodDesc.namespace,
      name: methodDesc.name,
      js: {
        code: jsCode,
        imports: await mapImports(context, methodDesc.js.refs)
      },
      ts: {
        code: tsCode,
        imports: await mapImports(context, methodDesc.ts.refs)
      }
    }
  })));

  return descriptors;
}

function formatMessagesCode(messageDescriptors) {
  return {
    jsCode: `
      ${Object.keys(messageDescriptors.exports)
        .map((typeName) => formatMessageCode(typeName, messageDescriptors.exports[typeName]))
        .join(';\r\n')}

    module.exports = {
      ${Object.keys(messageDescriptors.exports)
        .map((typeName) => `${typeName}`)
        .join(',\r\n')}
    };
    `,
    tsCode: `
      ${Object.keys(messageDescriptors.exports)
        .map((typeName) => messageDescriptors.exports[typeName].ts.code)
        .join(';\r\n')}
    `
  };
}

function formatMessageCode(typeName, messageDesc) {
  return `const ${typeName} = ${messageDesc.js.code}.build();`
}

function formatMethodCode(methodDesc) {
  return {
    jsCode: `
      const ${methodDesc.methodName} =  ${methodDesc.js.code};

      module.exports = {
        ${methodDesc.methodName}(message, options) {
          return ${methodDesc.methodName}.invoke(message, options);
        }
      };`,
    tsCode: `
      export ${methodDesc.ts.code};
    `
  };
}

function mapImports(context, refs) {
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

function formatTypeName(descriptor) {
  return descriptor.namespace ? `${descriptor.namespace}.${descriptor.name}` : descriptor.name;
}

const builtinTypes = {
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
  bytes: {}
};

module.exports = {httpClientGen, mapImport, mapLocalImport};
