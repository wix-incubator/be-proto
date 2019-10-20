const {httpBinding} = require('../http');
const fetchInvoker = require('./fetch-invoker');

module.exports = function httpClientBinding(binding, request, response, options = {}) {
  const original = httpBinding.http(binding, request, response, options);

  return {
    // FIXME options will not be merged
    invoke(msg, options) {
      const invocationOptions = {
        ...options,
        invoker: resolveInvoker(options)
      };

      return original.invoke(msg, invocationOptions);
    },
    httpRoutes() {
      return original.httpRoutes();
    },
    createInvoke: original.createInvoke,
    bind: original.bind
  };
}

function resolveInvoker(options) {
  const fetch = options.fetch || global.fetch;

  if (fetch) {
    return fetchInvoker(fetch);
  }
}
