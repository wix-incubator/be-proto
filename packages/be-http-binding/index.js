const resolveHttpRoutes = require('./lib/resolve-http-routes');
const messageBuilder = require('./lib/message-builder');
const httpBinding = require('./lib/http-binding');
const builtInTypes = require('./lib/builtin-types');
const wellKnownTypes = require('./lib/well-known-types');

module.exports = {
  ...resolveHttpRoutes,
  ...messageBuilder,
  httpBinding,
  wellKnownTypes: {
    ...builtInTypes,
    ...wellKnownTypes
  }
};
