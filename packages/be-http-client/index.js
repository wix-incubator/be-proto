const {httpBinding, wellKnownTypes, messageBuilder} = require('@wix/be-http-binding');
const fetchInvoker = require('./lib/fetch-invoker');
const httpClientOptions = require('./lib/http-client-options');

module.exports = {
  fetchInvoker,
  ...httpBinding,
  http: httpClientOptions,
  ...wellKnownTypes,
  messageBuilder
};
