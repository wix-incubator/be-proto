const resolveHttpRoutes = require('./lib/resolve-http-routes');
const messageBuilder = require('./lib/message-builder');
const wellKnownTypes = require('./lib/well-known-types');

module.exports = {
  ...resolveHttpRoutes,
  ...messageBuilder,
  wellKnownTypes
};
