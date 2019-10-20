
module.exports = {
  messageBuilder
};

function messageBuilder(context = {}) {
  return {
    field(name, type, modifier) {
      return defineField(context, name, type, modifier);
    },
    repeated(name, type, modifier) {
      return defineField(context, name, type, modifier, {
        repeated: true
      });
    },
    build() {
      return message(context);
    }
  }
}

function defineField(context, name, type, modifier, props) {
  const resolvedModifier = modifierFrom(modifier);
  const modifierState = resolvedModifier.define ? resolvedModifier.define({name, type}) : undefined;

  return messageBuilder({
    ...context,
    [name]: {
      type, modifier: resolvedModifier, modifierState,
      ...props
    }
  });
}

function message(context) {
  const typeFunctionMemoized = {};

  return {
    isMessageType: true,
    fromValue(value) {
      if (!value) {
        return null;
      }

      const sources = valueSource(value);

      const result = {};
      const valueModifiers = [];

      Object.keys(context).forEach((field) => {
        const {repeated, modifier, type} = context[field];
        const fieldValues = sources.find(field);
        const typeNeedsResolution = typeof(type) === 'function';

        if ((typeNeedsResolution || type.isMessageType) && fieldValues.length == 0) {
          return null;
        }

        let resolvedType = type;

        if (typeNeedsResolution) {
          if (!typeFunctionMemoized[type]) {
            typeFunctionMemoized[type] = type();
          }

          resolvedType = typeFunctionMemoized[type];
        }

        if (!resolvedType || !resolvedType.fromValue) {
          throw new TypeError(`Failed to resolve type for a field '${field}'`);
        }

        if (repeated) {
          const rawValue = fieldValues.length > 0 ? (Array.isArray(fieldValues[0]) ? fieldValues[0] : [fieldValues[0]]) : [];
          result[field] = rawValue.map((value) => resolvedType.fromValue(value));
        } else if (resolvedType.isMessageType) {
          result[field] = resolvedType.fromValue(fieldValues);
        } else {
          result[field] = resolvedType.fromValue(fieldValues[0]);
        }

        if (modifier && modifier.value) {
          valueModifiers.push({
            field,
            modifier
          });
        }
      });

      valueModifiers.forEach(({field, modifier}) => {
        result[field] = modifier.value(result);
      });

      return result;
    },
    toJSON(value) {
      if (!value) {
        return null;
      }

      const result = {};

      Object.keys(value).forEach((field) => {
        if (!context[field]) {
          throw new Error(`Unknown message field ${field}`);
        }

        const {repeated, modifier, type} = context[field];
        const typeNeedsResolution = typeof(type) === 'function';
        const fieldValue = value[field];

        let resolvedType = type;

        if (typeNeedsResolution) {
          if (!typeFunctionMemoized[type]) {
            typeFunctionMemoized[type] = type();
          }

          resolvedType = typeFunctionMemoized[type];
        }

        if (!resolvedType || !resolvedType.fromValue) {
          throw new TypeError(`Failed to resolve type for a field '${field}'`);
        }

        if (repeated) {
          result[field] = fieldValue.map((value) => resolvedType.toJSON(value));
        } else {
          result[field] = resolvedType.toJSON(fieldValue);
        }
      });

      return result;
    }
  };
}

function modifierFrom(modifier) {
  if (typeof(modifier) === 'number') {
    return assignTag(modifier);
  }

  return modifier;
}

function assignTag(tag) {
  return {
    define() {
      return {
        tag
      };
    }
  }
}

function valueSource(value) {
  const sources = Array.isArray(value) ? value : [value];

  return {
    find(name) {
      const matches = [];

      for (let i = 0; i < sources.length; i++) {
        if (sources[i][name]) {
          matches.push(sources[i][name]);
        }
      }

      return matches;
    }
  }
}