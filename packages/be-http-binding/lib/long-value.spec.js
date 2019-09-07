const {expect} = require('chai');
const LongValue = require('./long-value');
const long = require('long');

describe('long-value', () => {

  it('should conver to number', () => {
    const value = LongValue.fromValue('123456789');

    expect(value.toNumber()).to.deep.equal(123456789);
  });

  it('should conver to long', () => {
    const value = LongValue.fromValue('12345678901234567890');

    expect(value.toLong(long)).to.deep.equal(long.fromString('12345678901234567890'));
  });

  it('should conver to string', () => {
    const value = LongValue.fromValue(1234567890123456);

    expect(value.toString()).to.equal('1234567890123456');
  });
});
