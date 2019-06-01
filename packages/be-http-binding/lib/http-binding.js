
module.exports = {
  http,
  get: bodyless('get'),
  post: body('post'),
  put: body('put')
};

function http(binding, requestMessage, responseMessage, methodOptions = {}) {
  return {
    async invoke(message, options = {}) {
      const result = await binding.invoke(requestMessage.fromValue(message), mergeOptions(methodOptions, options));

      return responseMessage.fromValue(result);
    }
  };

  function mergeOptions(a, b) {
    return {
      ...a,
      ...b
    };
  }
}

function bodyless(method) {
  return (path) => {
    const mapToUri = uriMapper(path);

    return methodInvoker(method, (message) => ({uri: mapToUri(message)}));
  };
}

function body(method) {
  return (path) => {
    const mapToPath = pathMapper(path);

    return methodInvoker(method, (message) => mapToPath(message));
  };
}

function methodInvoker(method, getUriAndMessage) {
  return {
    async invoke(rawMessage, options) {
      const invoker = options.invoker;
      const {uri, message} = getUriAndMessage(rawMessage);

      const params = {
        method,
        uri,
        options
      };

      if (message) {
        params.message = message;
      }

      return invoker.invoke(params);
    }
  };
}

function uriMapper(path) {
  return (message) => `${path}?${valueToQuery(message)}`;
}

function pathMapper(path) {
  const [prefix, ...rest] = path.split(/({.+?})/g);

  return (message) => {
    const copy = {...message};

    const uri = prefix + rest.map((placeholderOrValue) => {
      if (placeholderOrValue.startsWith('{')) {
        const fieldName = placeholderOrValue.substring(1, placeholderOrValue.length - 1);
        const value = message[fieldName];

        delete copy[fieldName];

        return value;
      } else {
        return placeholderOrValue;
      }
    }).join('');

    return {
      uri,
      message: copy
    };
  };
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