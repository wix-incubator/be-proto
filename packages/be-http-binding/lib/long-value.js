
class LongValue {

  constructor(rawValue) {
    this.rawValue = rawValue;
  }

  static fromValue(rawValue) {
    const value = rawValue ? typeof(rawValue) === 'string' ? rawValue : 0 + rawValue
      : 0;

    return new LongValue(value);
  }

  toNumber() {
    return typeof(this.rawValue) === 'number' ? this.rawValue : parseInt(this.rawValue);
  }

  toString() {
    return this.rawValue.toString();
  }

  toLong(longImpl) {
    return longImpl.fromValue(this.rawValue);
  }
}

module.exports = LongValue;
