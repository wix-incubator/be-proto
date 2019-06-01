const startServer = require('./server');

module.exports = {
  serverBuilder
};

function serverBuilder(context = {}) {
  return {
    withBindings(bindings) {
      return serverBuilder({
        ...context,
        bindings
      });
    },
    withBindingsSource(bindingsSource) {
      return serverBuilder({
        ...context,
        bindingsSource
      });
    },
    async start(options) {
      const sourcedBindings = context.bindingsSource ? await context.bindingsSource.bindings() : [];
      const dynamicBindings = context.bindings || [];

      const bindings = [...sourcedBindings, ...dynamicBindings];

      return startServer({
        ...options,
        bindings
      });
    }
   };
}
