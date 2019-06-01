const {serverBuilder} = require('./lib/server-builder');
const protoModulesBindings = require('./lib/proto-modules-bindings');

module.exports = {
  builder: serverBuilder,
  fromProtoModules: protoModulesBindings
};
