const url = require('url');
const UrlPattern = require('url-pattern');
const {resolveHttpRoutes} = require('@wix/be-http-binding');
const querystring = require('querystring');

module.exports = function routes(services) {
  const routes = {};

  services.forEach(({service, bindings = {}}) => {
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
            pattern: new UrlPattern(fromCurly(path)),
            method: service.methods[methodName],
            implementation: bindings[methodName]
          });
        });
      });
    });
  });

  return {
    resolve(httpMethod, uri) {
      const parsedUri = url.parse(uri);

      const methodsForHttpMethod = routes[httpMethod.toLowerCase()];

      if (!methodsForHttpMethod) {
        return;
      }

      let resolvedRoute;

      let request = {};

      for (let i = 0; i < methodsForHttpMethod.length; i++) {
        request = methodsForHttpMethod[i].pattern.match(parsedUri.pathname);

        if (request) {
          resolvedRoute = methodsForHttpMethod[i];
          break;
        }
      }

      if (parsedUri.query > '') {
        const query = querystring.parse(parsedUri.query);

        for (let key in query) {
          set(request, key, query[key]);
        }
      }

      return {
        route: resolvedRoute,
        request
      };
    }
  };
};

function fromCurly(path) {
  return path.split('/')
    .map(part => {
      const match = part.match(/^{(\S+)}$/) || [];

      return match.length === 2 ? `:${match[1]}` : part;
    }).join('/');
}

function set(target, path, value) {
  forPath(target, path, ({context, name, lastPart}) => {
    if (lastPart) {
      context[name] = value;
    } else if (!context[name]) {
      context[name] = {};
    }
  });
}

function forPath(target, path, fn) {
  const pathParts = parsePath(path);
  const lastIndex = pathParts.length - 1;

  let context = target;
  let returnValue = undefined;

  for (let i = 0; i <= lastIndex; i++) {
    const name = pathParts[i];

    returnValue = fn({
      context,
      name,
      lastPart: i == lastIndex
    });

    context = context[name];
  }

  return returnValue;
}

function parsePath(path) {
  return path.split('.');
}
