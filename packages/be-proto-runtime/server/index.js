const {serverBuilder} = require('./lib/server-builder');
const protoModulesBindings = require('./lib/proto-modules-bindings');
const serverLauncher = require('./lib/server-launcher');

module.exports = {
  builder: serverBuilder,
  fromProtoModules: protoModulesBindings,
  ServerLauncher: serverLauncher
};
