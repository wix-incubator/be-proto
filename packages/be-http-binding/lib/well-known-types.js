
module.exports = {
  string: {
    fromValue(value) {
      return (value || '').toString();
    }
  },
  int32: {
    fromValue(value) {
      if (!value) {
        return 0;
      }

      if (typeof(value) === 'number') {
        return Math.floor(value);
      }

      if (typeof(value) === 'string') {
        return parseInt(value);
      }

      return 0 + value;
    }
  },
  StringValue: {
    fromValue(value) {
      return value ? value.toString() : null;
    }
  }
};
