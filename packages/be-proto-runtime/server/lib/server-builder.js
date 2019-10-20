const startServer = require('./server');

module.exports = {
  serverBuilder
};

function serverBuilder(context = {}) {
  return {
    withBindings() {
      const bindings = Array.prototype.slice.call(arguments);

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
      if (!options && process.env.BE_SERVER_START_OPTIONS) {
        options = JSON.parse(process.env.BE_SERVER_START_OPTIONS);
      }

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
