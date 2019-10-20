const LongValue = require('./long-value');

const IntValue = {
  fromValue: parseInt32(),
  toJSON(value) {
    return Math.floor(value);
  }
};

const NumberValue = {
  fromValue: fromValueAsNumber(parseFloat),
  toJSON(value) {
    return value;
  }
};

module.exports = {
  string: {
    fromValue(value) {
      return (value || '').toString();
    },
    toJSON(value) {
      return value.toString();
    }
  },
  bool: {
    fromValue(value) {
      return value == true || false;
    },
    toJSON(value) {
      return value == true;
    }
  },
  int32: IntValue,
  sint32: IntValue,
  uint32: IntValue,
  fixed32: IntValue,
  sfixed32: IntValue,
  double: NumberValue,
  float: NumberValue,
  int64: LongValue,
  uint64: LongValue,
  sint64: LongValue,
  fixed64: LongValue,
  sfixed64: LongValue,
  LongValue,
  bytes: {
    fromValue(value) {
      return value ? Buffer.from(value, 'base64') : Buffer.from('', 'utf-8');
    },
    toJSON(value) {
      return value.toString('base64');
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
