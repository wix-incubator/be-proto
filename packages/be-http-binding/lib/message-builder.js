
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
    fromValue(value) {
      const result = {};
      const valueModifiers = [];

      Object.keys(context).forEach((field) => {
        const {repeated, modifier, type} = context[field];

        if (repeated) {
          result[field] = (Array.isArray(value[field]) ? value[field] : [value[field]]).map((value) => type.fromValue(value));
        } else {
          result[field] = type.fromValue(value[field]);
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