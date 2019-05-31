const wellKnownTypes = require('./well-known-types');
const {expect} = require('chai');

describe('well-known-types', () => {

  describe('string', () => {

    [['string-val', 'string-val'], [99, '99'], [true, 'true'], [null, ''], [undefined, '']].forEach(([from, to]) =>
      it(`should read from ${from} as ${to}`, () => {
        expect(wellKnownTypes.string.fromValue(from)).to.equal(to);
      })
    );
  });

  describe('int32', () => {

    [[99, 99], ['99', 99], [true, 1], [null, 0], [undefined, 0]].forEach(([from, to]) =>
      it(`should read from ${from} as ${to}`, () => {
        expect(wellKnownTypes.int32.fromValue(from)).to.equal(to);
      })
    );
  });
});
