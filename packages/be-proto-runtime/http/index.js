const resolveHttpRoutes = require('./resolve-http-routes');
const messageBuilder = require('./message-builder');
const enumBuilder = require('./enum-builder');
const httpBinding = require('./http-binding');
const builtInTypes = require('./builtin-types');
const wellKnownTypes = require('./well-known-types');

module.exports = {
  ...resolveHttpRoutes,
  ...messageBuilder,
  ...enumBuilder,
  httpBinding,
  wellKnownTypes: {
    ...builtInTypes,
    ...wellKnownTypes
  }
};
