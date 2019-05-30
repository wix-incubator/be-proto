const http = require('http');
const UrlPattern = require('url-pattern');
const {resolveHttpRoutes} = require('@wix/be-http-binding');
const url = require('url');

module.exports = function start(options) {
  const routes = resolveRoutes(options.services)

  const server = http.createServer(async(req, res) => {
    try {
      const parsedUrl = url.parse(req.url);
      const httpMethod = req.method;

      const route = routes.resolve(httpMethod, parsedUrl.pathname);

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

function resolveRoutes(services) {
  const routes = {};

  services.forEach(({service, bindings}) => {
    const serviceRoutes = resolveHttpRoutes(service);

    Object.keys(serviceRoutes).forEach((methodName) => {
      const methodRoutes = serviceRoutes[methodName];

      Object.keys(methodRoutes).forEach((httpMethod) => {
        const httpMethodLower = httpMethod.toLowerCase();

        if (!routes[httpMethodLower]) {
          routes[httpMethodLower] = [];
        }

        methodRoutes[httpMethod].forEach((path) => {
          routes[httpMethodLower].push({
            pattern: new UrlPattern(path),
            method: service.methods[methodName],
            implementation: bindings[methodName]
          });
        });
      });
    });
  });

  return {
    resolve(httpMethod, uri) {
      const methodsForHttpMethod = routes[httpMethod.toLowerCase()];

      if (!methodsForHttpMethod) {
        return;
      }

      let resolvedRoute;

      for (let i = 0; i < methodsForHttpMethod.length; i++) {
        if (methodsForHttpMethod[i].pattern.match(uri)) {
          resolvedRoute = methodsForHttpMethod[i];
          break;
        }
      }

      return resolvedRoute;
    }
  };
}