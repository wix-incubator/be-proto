const {httpBinding, wellKnownTypes, messageBuilder, enumBuilder} = require('./http/');
const fetchInvoker = require('./lib/fetch-invoker');
const httpClientOptions = require('./lib/http-client-options');

module.exports = {
  fetchInvoker,
  ...httpBinding,
  http: httpClientOptions,
  ...wellKnownTypes,
  messageBuilder,
  enumBuilder,
  oneOf
};

function oneOf(name) {
  return {
    define() {
      return {
        oneOf: name
      };
    }
  }
}