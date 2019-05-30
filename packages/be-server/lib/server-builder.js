const {create} = require('@wix/proto-packages');
const startServer = require('./server');
const defaultContextDir = require('find-root')(process.argv[1]);

module.exports = {
  serverBuilder
};

function serverBuilder(context = {}) {
  return {
    withContextDir(contextDir) {
      return serverBuilder({
        ...context,
        contextDir
      });
    },
    withExtraProtoPackage(extraPackageDir) {
      return serverBuilder({
        ...context,
        extraPackageDir
      });
    },
    withService(serviceType, implementation) {
      const services = {...(context.services || {})};

      services[serviceType] = implementation;

      context.services = services;

      return serverBuilder({
        ...context
      });
    },
    async start(options) {
      const protoContext = create({
        contextDir: context.contextDir || defaultContextDir,
        sourceRoots: ['proto'],
        extraPackages: [context.extraPackageDir]
      });

      const loadedContext = await protoContext.loadedContext();

      const services = Object.keys(context.services).map((serviceName) => {
        const service = loadedContext.lookupService(serviceName);
        const bindings = {};

        Object.values(service.methods).forEach((method) => {
          bindings[method.name] = context.services[serviceName][toSmallCap(method.name)];
        });

        return {
          service,
          bindings
        };
      });

      return startServer({
        ...options,
        services
      });
    }
   };
}

function toSmallCap(value) {
  return value.charAt(0).toLowerCase() + value.slice(1);
}