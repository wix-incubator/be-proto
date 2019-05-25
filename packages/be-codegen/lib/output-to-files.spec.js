const {toRequireLines} = require('./output-to-files');
const {expect} = require('chai');

describe('output-to-files', () => {

  it('should require external package', () => {
    const givenImports = [{
      packageName: 'pkg-1',
      name: 'obj'
    }];

    const lines = toRequireLines(givenImports);

    expect(lines[0]).to.equal(`const {obj} = require('pkg-1');`);
  });

  it('should require internal object', () => {
    const givenImports = [{
      namespace: 'test.ns',
      name: 'obj'
    }];

    const lines = toRequireLines(givenImports, '.');

    expect(lines[0]).to.equal(`const {obj} = require('./test.ns/obj');`);
  });

  it('should require internal object relatively', () => {
    const givenImports = [{
      namespace: 'test.ns',
      name: 'obj'
    }];

    const lines = toRequireLines(givenImports, 'test.ns2/obj');

    expect(lines[0]).to.equal(`const {obj} = require('../test.ns/obj');`);
  });
});
