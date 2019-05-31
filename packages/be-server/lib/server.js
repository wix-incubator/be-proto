const http = require('http');
const routes = require('./routes');

module.exports = function start(options) {
  const methodRoutes = routes(options.services)

  const server = http.createServer(async(req, res) => {
    try {
      const {route, request} = methodRoutes.resolve(req.method, req.url);

      if (!route) {
        res.statusCode = 404;
      }

      const contentType = req.headers['content-type'];

      if (contentType) {
        await new Promise((resolve, reject) =>
          req.on('data', async(data) => {
            try {
              resolve(await execute(route, res, JSON.parse(data)));
            } catch(e) {
              reject(e);
            }
          }));
      } else {
        await execute(route, res, request);
      }
    } catch(e) {
      res.statusCode = 500;
      res.write(e.toString());
      console.error(e);
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

async function execute(route, res, body) {
  const result = await route.implementation(body);

  res.setHeader('Content-Type', 'application/json');
  res.write(JSON.stringify(result));
}