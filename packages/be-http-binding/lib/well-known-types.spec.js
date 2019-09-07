const wellKnownTypes = require('./well-known-types');
const {expect} = require('chai');

describe('well-known-types', () => {

  describe('StringValue', () => {

    [['string-val', 'string-val'], [99, '99'], [true, 'true'], [null, null], [undefined, null]].forEach(([from, to]) =>
      it(`should read from ${from} as ${to}`, () => {
        expect(wellKnownTypes.StringValue.fromValue(from)).to.equal(to);
      })
    );
  });

  describe('Int32Value', () => {

    [['100', 100], [99, 99], [null, null], [undefined, null]].forEach(([from, to]) =>
      it(`should read from ${from} as ${to}`, () => {
        expect(wellKnownTypes.Int32Value.fromValue(from)).to.equal(to);
      })
    );
  });
});
