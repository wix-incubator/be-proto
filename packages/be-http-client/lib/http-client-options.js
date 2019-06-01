const {httpBinding} = require('@wix/be-http-binding');
const fetchInvoker = require('./fetch-invoker');

module.exports = function httpClientBinding(binding, request, response, options = {}) {
  const bindingOptions = {
    ...options,
    invoker: resolveInvoker(options)
  };

  return httpBinding.http(binding, request, response, bindingOptions);
}

function resolveInvoker(options) {
  const fetch = options.fetch || global.fetch;

  if (fetch) {
    return fetchInvoker(fetch);
  }
}
