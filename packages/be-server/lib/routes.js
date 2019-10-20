const url = require('url');
const UrlPattern = require('url-pattern');
const querystring = require('querystring');

module.exports = function routes(bindings) {
  const routes = {};

  bindings.forEach((binding) => {
    binding.httpRoutes().forEach(({method, path}) => {
      const httpMethodLower = method.toLowerCase();

      if (!routes[httpMethodLower]) {
        routes[httpMethodLower] = [];
      }

      routes[httpMethodLower].push({
        pattern: new UrlPattern(fromCurly(path)),
        method,
        invoke: binding.invoke
      });
    })
  });

  return {

    resolve(httpMethod, uri) {
      const parsedUri = url.parse(uri);
      const methodsForHttpMethod = routes[httpMethod.toLowerCase()];

      if (!methodsForHttpMethod) {
        return {};
      }

      let resolvedRoute;
      let request;

      for (let i = 0; i < methodsForHttpMethod.length; i++) {
        request = methodsForHttpMethod[i].pattern.match(parsedUri.pathname);

        if (request) {
          resolvedRoute = methodsForHttpMethod[i];
          break;
        }
      }

      if (request && parsedUri.query > '') {
        const query = querystring.parse(parsedUri.query);

        for (let key in query) {
          set(request, key, query[key]);
        }
      }

      return {
        invoke: resolvedRoute ? resolvedRoute.invoke : null,
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
