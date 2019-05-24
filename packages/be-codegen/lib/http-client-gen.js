const {generateType} = require('./message-generator');

function httpClient(context) {
  return {
    async generate(typeNames, output) {
      try {
        const types = await context.queryTypesFor(typeNames);

        types.map((type) => {
          const messageDesc = generateType(type);

          const messageCode = `
          module.exports = {
            get ${type.name}: lazy(() => buildType())
          }

          function buildType() {
            ${messageDesc.js.code}
            .build()
          }`

          output.add({
            namespace: messageDesc.namespace,
            name: messageDesc.name,
            js: {
              imports: [],
              code: messageCode
            }
          });
        });
      } finally {
        output.complete();
      }
    }
  };
}

module.exports = {
  httpClient
};
