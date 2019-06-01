const {typeUtils} = require('@wix/proto-packages');
const reference = require('./reference');

module.exports = {
  generateMethod
};

function generateMethod(serviceMethod) {
  const route = resolveHttpRoute(serviceMethod);
  const jsRefs = {};

  reference(serviceMethod.requestType, serviceMethod.parent, jsRefs);
  reference(serviceMethod.responseType, serviceMethod.parent, jsRefs);

  const requestType = serviceMethod.requestStream ? `${reference('stream', null, jsRefs)}(${serviceMethod.requestType})` : serviceMethod.requestType;
  const responseType = serviceMethod.responseStream ? `${reference('stream', null, jsRefs)}(${serviceMethod.responseType})` : serviceMethod.responseType;

  const fnCode = `${reference('http', null, jsRefs)}(${reference(route.method, null, jsRefs)}('${route.path}'), ${requestType}, ${responseType})`;

  return {
    name: `${serviceMethod.parent.name}.${serviceMethod.name}`,
    methodName: serviceMethod.name,
    namespace: typeUtils.resolveNamespace(serviceMethod.parent),
    js: {
      code: fnCode,
      refs: jsRefs
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