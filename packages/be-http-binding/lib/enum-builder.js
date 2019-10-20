
module.exports = {
  enumBuilder
};

function enumBuilder(context = {fields:{}, values:{}}) {
  return {
    value(name, value) {
      return enumBuilder({...context,
        fields: {
          ...context.fields, [name]: value
        },
        values: {
          ...context.fields,
          [value.toString]: name,
          [value]: name,
          [name]: name
        }
      });
    },
    build() {
      return {
        fromValue(value) {
          return context.values[value];
        }
      };
    }
  }
}
