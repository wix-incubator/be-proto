
module.exports = {
  messageBuilder
};

function messageBuilder(context = {}) {
  return {
    field(name, type, tag) {
      return messageBuilder({
        ...context,
        [name]: {
          type, tag
        }
      });
    },
    repeated(name, type, tag) {
      return messageBuilder({
        ...context,
        [name]: {
          type, tag, repeated: true
        }
      });
    },
    build() {
      return message(context);
    }
  }
}

function message(context) {
  return {
    fromValue(value) {
      const result = {};

      Object.keys(context).forEach((field) => {
        if (context[field].repeated) {
          result[field] = value[field].map((value) => context[field].type.fromValue(value));
        } else {
          result[field] = context[field].type.fromValue(value[field]);
        }
      });

      return result;
    }
  };
}
