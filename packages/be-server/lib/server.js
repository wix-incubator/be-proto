const http = require('http');
const routes = require('./routes');

module.exports = function start(options) {
  const methodRoutes = routes(options.bindings);

  const server = http.createServer(async(req, res) => {
    try {
      const {invoke, request} = methodRoutes.resolve(req.method, req.url);

      if (!invoke) {
        res.statusCode = 404;
      } else {
        const contentType = req.headers['content-type'];

        if (contentType) {
          await new Promise((resolve, reject) =>
            req.on('data', async(data) => {
              try {
                resolve(await execute(invoke, res, request, JSON.parse(data)));
              } catch(e) {
                reject(e);
              }
            }));
        } else {
          await execute(invoke, res, request);
        }
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

async function execute(invoke, res, request, body = {}) {
  const result = await invoke([request, body]);

  res.setHeader('Content-Type', 'application/json');
  res.write(JSON.stringify(result));
}