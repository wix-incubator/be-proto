const http = require('http');
const routes = require('./routes');

module.exports = function start(options) {
  const methodRoutes = routes(options.services)

  const server = http.createServer(async(req, res) => {
    try {
      const httpMethod = req.method;

      const route = methodRoutes.resolve(httpMethod, req.url);

      if (!route) {
        res.statusCode = 404;
      }

      const result = await route.implementation({message: 'Hello'});

      res.write(JSON.stringify(result));
    } catch(e) {
      res.statusCode = 500;
      res.write(e.toString());
    } finally {
      res.end();
    }
  });

  server.on('clientError', (err, socket) => {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
  });

  const handle = server.listen(options.port);

  return {
    stop() {
      handle.close();
    }
  };
};
