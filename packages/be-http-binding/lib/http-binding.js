
module.exports = {
  http,
  get: bodyless('get'),
  post: body('post'),
  put: body('put')
};

function http(method, path, requestMessage, responseMessage, methodOptions) {
  const invocation = method(path, requestMessage, responseMessage);

  return {
    async invoke(message, options) {
      const result = await invocation.invokeWith(methodOptions.invoker || options.invoker, requestMessage.fromValue(message));

      return responseMessage.fromValue(result);
    }
  };
}

function bodyless(method) {
  return (path) => {
    const mapToUri = uriMapper(path);

    return methodInvoker(method, (message) => ({uri: mapToUri(message)}));
  };
}

function body(method) {
  return (path) => methodInvoker(method, (message) => ({uri: path, message}));
}

function methodInvoker(method, getUriAndMessage) {
  return {
    async invokeWith(invoker, rawMessage) {
      const {uri, message} = getUriAndMessage(rawMessage);

      const params = {
        method,
        uri
      };

      if (message) {
        params.message = message;
      }

      return invoker.invoke(params);
    }
  };
}

function uriMapper(path) {
  // const [first, ...rest] = path.split(/{(.+?)}/g);

  // console.log(first);

  return (message) => `${path}?${valueToQuery(message)}`;
}

function valueToQuery(value) {
  const flattenedValues = flattenValues(value);

  return flattenedValues.map(({value, path}) => `${path}=${value}`);
}

function flattenValues(value, path = '') {
  return _flattenValues(value, path).map(({value, path}) => ({
    value,
    path: path.startsWith('.') ? path.substring(1) : path
  }));
}

function _flattenValues(value, path = '') {
  if (!value) {
    return [];
  }

  const fields = typeof(value) === 'object' ? Object.keys(value) : null;

  if (!fields) {
    return [{ path, value }];
  }

  return flatten(fields.map((key) => {
    const fieldValue = value[key];
    const newPath = `${path}.${key}`;

    if (!fieldValue) {
      return [];
    }

    const valuesToMap = Array.isArray(fieldValue) ?
      toRepeatedValue(fieldValue, newPath) :
      toValue(fieldValue, newPath);

    return valuesToMap;
  }));
}

function toRepeatedValue(value, path) {
  return flatten(value.map((element) => toValue(element, path)));
}

function toValue(value, path) {
  return typeof(value) === 'object' ? flattenValues(value, path) : [{value, path}];
}

function flatten(array) {
  let newArray = [];

  array.forEach((item) => {
    if (Array.isArray(item)) {
      newArray = newArray.concat(item);
    } else {
      newArray.push(item);
    }
  });

  return newArray;
}