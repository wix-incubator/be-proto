const {typeUtils} = require('@wix/proto-packages');
const codeReferences = require('./code-references');

module.exports = {
  generateMethod
};

function generateMethod(serviceMethod) {
  const route = resolveHttpRoute(serviceMethod);
  const refs = codeReferences();

  const requestType = refs.jsReference(serviceMethod.requestType, serviceMethod.parent);
  const responseType = refs.jsReference(serviceMethod.responseType, serviceMethod.parent);

  const tsRequestType = refs.tsReference(serviceMethod.requestType, serviceMethod.parent);
  const tsResponseType = refs.tsReference(serviceMethod.responseType, serviceMethod.parent);

  const bindingJsCode = `${refs.jsReference('http')}(${refs.jsReference(route.method)}('${route.path}'), ` +
    `${formatJsArgument(requestType, serviceMethod.requestStream, refs)}, ` +
    `${formatJsArgument(responseType, serviceMethod.responseStream, refs)})`;

  const methodNameSmall = toSmallCap(serviceMethod.name);

  const tsInvocationCode = `function ${methodNameSmall}(request: ${formatTsArgument(tsRequestType, serviceMethod.requestStream, refs)}, options?: ${refs.tsReference('be.CallOptions')}): ` +
    `${formatTsArgument(tsResponseType, serviceMethod.responseStream, refs, true)}`;

  return {
    name: `${serviceMethod.parent.name}.${serviceMethod.name}`,
    methodName: serviceMethod.name,
    methodNameSmall,
    namespace: typeUtils.resolveNamespace(serviceMethod.parent),
    exports: {
      binding: {
        js: {
          code: bindingJsCode
        },
        ts: {
          code: `const ${serviceMethod.name}: ${refs.tsReference('be.HttpBinding')}`
        }
      },
      invoke: {
        js: {
          code: `
          ${methodNameSmall}(message, options) {
            return ${serviceMethod.name}.invoke(message, options);
          }`
        },
        ts: {
          code: tsInvocationCode
        }
      }
    },
    js: {
      refs: refs.jsRefs
    },
    ts: {
      refs: refs.tsRefs
    }
  };
}

function formatJsArgument(typeName, isStream, refs) {
  return isStream ? `${refs.jsReference('stream')}(${typeName})` : typeName;
}

function formatTsArgument(typeName, isStream, refs, deferred) {
  return isStream ? `${refs.tsReference('Stream')}(${typeName})` : (deferred ? `Promise<${typeName}>` : typeName);
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

function toSmallCap(value) {
  return value.charAt(0).toLowerCase() + value.slice(1);
}
