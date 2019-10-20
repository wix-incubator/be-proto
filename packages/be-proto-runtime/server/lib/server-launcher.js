const debug = require('debug')('be-server');

const startingInstances = {}

module.exports = {
  async embedded(requireFn, opts) {
    process.env.BE_SERVER_START_OPTIONS = JSON.stringify(opts);

    requireFn();

    await serverStartupAt(opts.port);

    return {
      async stop() {
        debug(`Stopping embedded server at port ${opts.port}`);

        const instance = await serverStartupAt(opts.port);

        if (!instance) {
          throw new Error(`Could not find server instance on ${opts.port}`);
        }

        instance.stop();
      }
    }
  },

  registerStartingInstance(port, instance) {
    startingInstances[port] = instance;
  }
};

async function serverStartupAt(port) {
  if (!startingInstances[port]) {
    throw new Error(`Server has not set to start at port ${port}`);
  }

  return startingInstances[port];
}

function requireServer(appPath) {
  const cached = require.resolve(appPath);

  debug(`Server path resolved to ${cached}`);

  delete require.cache[cached];

  require(appPath);
}
