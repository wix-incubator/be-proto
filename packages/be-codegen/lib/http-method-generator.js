const {typeUtils} = require('@wix/proto-packages');

module.exports = {
  generateMethod
};

function generateMethod(serviceMethod) {
  const route = resolveHttpRoute(serviceMethod);

  const requestType = serviceMethod.requestStream ? `stream(${serviceMethod.requestType})` : serviceMethod.requestType;
  const responseType = serviceMethod.responseStream ? `stream(${serviceMethod.responseType})` : serviceMethod.responseType;

  const fnCode = `http(${route.method}, '${route.path}', ${requestType}, ${responseType})`;

  return {
    name: `${serviceMethod.parent.name}.${serviceMethod.name}`,
    namespace: typeUtils.resolveNamespace(serviceMethod.parent),
    js: {
      code: fnCode
    }
  };
}

const supportedMethods = {
  'get': true, 'put': true, 'post': true, 'delete': true, 'patch': true
};

const httpOptionsPrefix = '(google.api.http).';

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