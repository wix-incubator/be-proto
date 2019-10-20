const builtInTypes = require('./builtin-types');
const {expect} = require('chai');

describe('builtin-types', () => {

  describe('string', () => {

    [['string-val', 'string-val'], [99, '99'], [true, 'true'], [null, ''], [undefined, '']].forEach(([from, to]) =>
      it(`should read from ${from} as ${to}`, () => {
        expect(builtInTypes.string.fromValue(from)).to.equal(to);
      })
    );

    it('should write to JSON', () => {
      expect(builtInTypes.string.toJSON('Hello')).to.equal('Hello');
    });
  });

  describe('int32', () => {

    [[99, 99], ['99', 99], [true, 1], [null, 0], [undefined, 0]].forEach(([from, to]) =>
      it(`should read from ${from} as ${to}`, () => {
        expect(builtInTypes.int32.fromValue(from)).to.equal(to);
      })
    );

    it('should write to JSON', () => {
      expect(builtInTypes.int32.toJSON(1)).to.equal(1);
    });

    it('should round to floor', () => {
      expect(builtInTypes.int32.toJSON(1.7)).to.equal(1);
    });
  });

  describe('double', () => {

    [[99, 99], ['99', 99], [true, 1], [null, 0], [undefined, 0]].forEach(([from, to]) =>
      it(`should read from ${from} as ${to}`, () => {
        expect(builtInTypes.double.fromValue(from)).to.equal(to);
      })
    );

    it('should write to JSON', () => {
      expect(builtInTypes.double.toJSON(12.3)).to.equal(12.3);
    });
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

    it('should write to JSON', () => {
      expect(builtInTypes.bool.toJSON(true)).to.equal(true);
    });
  });

  describe('bytes', () => {

    const empty = Buffer.from('', 'utf-8');

    [['SGVsbG8=', Buffer.from('Hello', 'utf-8')], ['', empty], [null, empty], [undefined, empty]].forEach(([from, to]) =>
      it(`should read from ${from} as ${to}`, () => {
        expect(builtInTypes.bytes.fromValue(from)).to.deep.equal(to);
      })
    );

    it('should write to JSON', () => {
      const givenValue = Buffer.from('Hello', 'utf-8');

      expect(builtInTypes.bytes.toJSON(givenValue)).to.equal('SGVsbG8=');
    });
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
