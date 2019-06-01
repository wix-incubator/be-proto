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
    const code = formatMessagesCode(messageDescriptors);
    const imports = await mapImports(context, messageDescriptors);

    const name = numTypesToExport > 1 ? `agg_${typeNamesToExport.join('_')}` : typeNamesToExport[0];

    descriptors = descriptors.concat([{
      namespace: messageDescriptors.namespace,
      name,
      js: {
        code,
        imports
      }
    }]);
  }

  descriptors = descriptors.concat(await Promise.all(methods.map(async(method) => {
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
  })));

  return descriptors;
}

function formatMessagesCode(messageDescriptors) {
  return `
    ${Object.keys(messageDescriptors.exports)
      .map((typeName) => formatMessageCode(typeName, messageDescriptors.exports[typeName]))
      .join(';\r\n')}

  module.exports = {
    ${Object.keys(messageDescriptors.exports)
      .map((typeName) => `${typeName}`)
      .join(',\r\n')}
  };
  `;
}

function formatMessageCode(typeName, messageDesc) {
  return `const ${typeName} = ${messageDesc.js.code}.build();`
}

function formatMethodCode(methodDesc) {
  return `
  const ${methodDesc.methodName} =  ${methodDesc.js.code};

  module.exports = {
    ${methodDesc.methodName}(message, options) {
      return ${methodDesc.methodName}.invoke(message, options);
    }
  };`
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
