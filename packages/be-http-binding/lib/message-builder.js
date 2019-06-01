
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

        if (repeated) {
          result[field] = (Array.isArray(fieldValues[0]) ? fieldValues[0] : [fieldValues[0]]).map((value) => type.fromValue(value));
        } else if (type.isMessageType) {
          result[field] = type.fromValue(fieldValues);
        } else {
          result[field] = type.fromValue(fieldValues[0]);
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