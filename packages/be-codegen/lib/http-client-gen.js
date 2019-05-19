
function httpClient(context) {
  return {
    async generate(typeNames, output) {
      const types = await context.queryTypesFor(typeNames);

      console.log(types);
    }
  };
}

module.exports = {
  httpClient
};
