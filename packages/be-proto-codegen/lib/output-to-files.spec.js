const {toRequireLines, toImportLines} = require('./output-to-files');
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

  it('should require object in root', () => {
    const givenImports = [{
      name: 'obj',
      namespace: ''
    }];

    const lines = toRequireLines(givenImports, '.');

    expect(lines[0]).to.equal(`const {obj} = require('./obj');`);
  });

  it('should require internal object relatively', () => {
    const givenImports = [{
      namespace: 'test.ns',
      name: 'obj'
    }];

    const lines = toRequireLines(givenImports, 'test.ns2/obj');

    expect(lines[0]).to.equal(`const {obj} = require('../test.ns/obj');`);
  });

  it('should import 1st part of the namespace', () => {
    const givenImports = [{
      packageName: 'pkg-1',
      name: 'ns.obj'
    }];

    const lines = toImportLines(givenImports);

    expect(lines[0]).to.equal(`import {ns} from 'pkg-1';`);
  });

  it('should import same namespace only once', () => {
    const givenImports = [{
      packageName: 'pkg-1',
      name: 'ns.obj1'
    }, {
      packageName: 'pkg-1',
      name: 'ns.obj2'
    }];

    const lines = toImportLines(givenImports);

    expect(lines).to.have.length(1);
    expect(lines[0]).to.equal(`import {ns} from 'pkg-1';`);
  });
});
