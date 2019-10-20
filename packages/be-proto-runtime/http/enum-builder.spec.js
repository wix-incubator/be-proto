const {enumBuilder} = require('./enum-builder');
const {expect} = require('chai');

describe('enum-builder', () => {

  it('should get a number value', () => {
    const givenEnum = enumBuilder()
      .value('ABC', 1)
      .build();

    expect(givenEnum.fromValue(1)).to.equal('ABC');
    expect(givenEnum.fromValue('1')).to.equal('ABC');
    expect(givenEnum.fromValue('ABC')).to.equal('ABC');
  });
});
