const LongValue = require('./long-value');

module.exports = {
  string: {
    fromValue(value) {
      return (value || '').toString();
    }
  },
  bool: {
    fromValue(value) {
      return value == true || false;
    }
  },
  int32: {
    fromValue: parseInt32()
  },
  uint32: {
    fromValue: parseInt32()
  },
  double: {
    fromValue: fromValueAsNumber(parseFloat)
  },
  float: {
    fromValue: fromValueAsNumber(parseFloat)
  },
  int64: LongValue,
  uint64: LongValue,
  LongValue,
  bytes: {
    fromValue(value) {
      return value ? Buffer.from(value, 'base64') : Buffer.from('', 'utf-8');
    }
  }
};

function parseInt32() {
  return fromValueAsNumber(parseInt, (value) => Math.floor(value));
}

function fromValueAsNumber(parseNumber, adaptValue) {
  return (value) => {
    if (!value) {
      return 0;
    }

    if (typeof(value) === 'number') {
      return adaptValue ? adaptValue(value) : value;
    }

    if (typeof(value) === 'string') {
      return parseNumber(value);
    }

    return 0 + value;
  }
}
