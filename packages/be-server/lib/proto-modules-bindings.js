const {create} = require('@wix/proto-packages');
const defaultContextDir = require('find-root')(process.argv[1]);
const messageTypes = require('./message-types');
const {resolveHttpRoutes, httpBinding} = require('@wix/be-http-binding');
const path = require('path');

module.exports = function protoModulesBindings(contextOptions, serviceBindings) {
  return {
    async bindings() {
      const pathToHttpBindingProto = path.resolve(path.dirname(require.resolve('@wix/be-http-binding')), 'proto');
      const extra = contextOptions.extraPackages;
      const extraPackages = extra ? (Array.isArray(extra) ? extra : [extra]) : [];

      extraPackages.push(pathToHttpBindingProto);

      const protoContext = create({
        contextDir: defaultContextDir,
        ...contextOptions,
        extraPackages
      });
      const loadedContext = await protoContext.loadedContext();

      return loadProtoBindings(loadedContext, serviceBindings);
    }
  };
};

async function loadProtoBindings(loadedContext, serviceBindings) {
  const bindings = [];
  const types = messageTypes(loadedContext);

  Object.keys(serviceBindings).forEach((serviceName) => {
    const service = loadedContext.lookupService(serviceName);
    const routes = resolveHttpRoutes(service);
    const implementationBindings = serviceBindings[serviceName];

    Object.values(service.methods).forEach((method) => {
      const route = routes[method.name];

      if (route) {
        const jsMethodName = toSmallCap(method.name);

        Object.keys(route).forEach((httpMethod) => {
          route[httpMethod].forEach((path) => {
            bindings.push({
              binding: httpBinding.http(
                httpBinding[httpMethod.toLowerCase()](path),
                types.lookup(service, method.requestType),
                types.lookup(service, method.responseType)),
              invoke: implementationBindings[jsMethodName]
            });
          });
        });
      }
    });
  });

  return bindings;
}

function toSmallCap(value) {
  return value.charAt(0).toLowerCase() + value.slice(1);
}
