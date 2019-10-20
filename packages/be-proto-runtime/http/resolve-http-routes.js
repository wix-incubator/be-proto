
module.exports = {
  resolveHttpRoute,
  resolveHttpRoutes
}

const supportedMethods = {
  'get': true, 'put': true, 'post': true, 'delete': true, 'patch': true
};

const httpOptionsPrefix = '(google.api.http).';

function resolveHttpRoutes(service) {
  const routes = {};

  Object.keys(service.methods).forEach((methodName) => {
    const {method: httpMethod, path} = resolveHttpRoute(service.methods[methodName]);

    const methodRoutes = routes[methodName] || {};

    if (httpMethod) {
      const methodHttpMethods = methodRoutes[httpMethod] || [];

      methodHttpMethods.push(path);

      methodRoutes[httpMethod] = methodHttpMethods;
    }

    routes[methodName] = methodRoutes;
  });

  return routes;
}

function resolveHttpRoute(method) {
  const route = {};

  for (let option in method.options || {}) {
    if (option.indexOf(httpOptionsPrefix) === 0) {
      const maybeVerb = option.substring(httpOptionsPrefix.length, option.length);

      if (supportedMethods[maybeVerb]) {
        route.method = maybeVerb,
        route.path = method.options[option];
      }

      if (maybeVerb === 'body') {
        route.body = method.options[option];
      }

      if (maybeVerb === 'custom.kind') {
        const customVerb = method.options[option];
        const path = method.options[httpOptionsPrefix + 'custom.path'];

        if (path) {
          route.method = customVerb,
          route.path = path;
        }
      }
    }
  }

  return route;
}