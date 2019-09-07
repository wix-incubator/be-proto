const builtInTypes = require('./builtin-types');
const {expect} = require('chai');

describe('builtin-types', () => {

  describe('string', () => {

    [['string-val', 'string-val'], [99, '99'], [true, 'true'], [null, ''], [undefined, '']].forEach(([from, to]) =>
      it(`should read from ${from} as ${to}`, () => {
        expect(builtInTypes.string.fromValue(from)).to.equal(to);
      })
    );
  });

  describe('int32', () => {

    [[99, 99], ['99', 99], [true, 1], [null, 0], [undefined, 0]].forEach(([from, to]) =>
      it(`should read from ${from} as ${to}`, () => {
        expect(builtInTypes.int32.fromValue(from)).to.equal(to);
      })
    );
  });

  describe('double', () => {

    [[99, 99], ['99', 99], [true, 1], [null, 0], [undefined, 0]].forEach(([from, to]) =>
      it(`should read from ${from} as ${to}`, () => {
        expect(builtInTypes.double.fromValue(from)).to.equal(to);
      })
    );
  });

  describe('float', () => {

    [[99, 99], ['99', 99], [true, 1], [null, 0], [undefined, 0]].forEach(([from, to]) =>
      it(`should read from ${from} as ${to}`, () => {
        expect(builtInTypes.float.fromValue(from)).to.equal(to);
      })
    );
  });

  describe('bool', () => {

    [[1, true], [0, false], [true, true], [false, false], [null, false], [undefined, false]].forEach(([from, to]) =>
      it(`should read from ${from} as ${to}`, () => {
        expect(builtInTypes.bool.fromValue(from)).to.equal(to);
      })
    );
  });

  describe('bytes', () => {

    const empty = Buffer.from('', 'utf-8');

    [['SGVsbG8=', Buffer.from('Hello', 'utf-8')], ['', empty], [null, empty], [undefined, empty]].forEach(([from, to]) =>
      it(`should read from ${from} as ${to}`, () => {
        expect(builtInTypes.bytes.fromValue(from)).to.deep.equal(to);
      })
    );
  });

  describe('int64', () => {

    [[99, 99], ['99', '99'], [true, 1], [null, 0], [undefined, 0]].forEach(([from, to]) =>
      it(`should read from ${from} as ${to}`, () => {
        expect(builtInTypes.int64.fromValue(from)).to.deep.equal(
          builtInTypes.LongValue.fromValue(to));
      })
    );
  });
});
