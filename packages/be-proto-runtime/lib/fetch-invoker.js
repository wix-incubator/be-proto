const {UnableToConnect} = require('./errors');

module.exports = function fetchInvoker(fetch) {
  return {
    async invoke({method, uri, message, options}) {
      const url = options.baseUrl ? `${options.baseUrl}${uri}` : uri;

      try {
        const res = await fetch(url, {
          method,
          headers: message ? {
            'content-type': 'application/json'
          } : {},
          body: message ? JSON.stringify(message) : undefined
        });

        return res.json();
      } catch(e) {
        throw new UnableToConnect(url, e);
      }
    }
  };
};
