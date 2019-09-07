const builtin = require('./builtin-types');

module.exports = {
  StringValue: wrapperValue(builtin.string),
  Int32Value: wrapperValue(builtin.int32),
  DoubleValue: wrapperValue(builtin.double),
  FloatValue: wrapperValue(builtin.float),
  Int64Value: wrapperValue(builtin.int64),
  UInt64Value: wrapperValue(builtin.uint64),
  UInt32Value: wrapperValue(builtin.uint32),
  BoolValue: wrapperValue(builtin.bool),
  BytesValue: wrapperValue(builtin.bytes),
};

function wrapperValue(wrappedType) {
  return {
    fromValue(value) {
      return value ? wrappedType.fromValue(value) : null;
    }
  };
}
