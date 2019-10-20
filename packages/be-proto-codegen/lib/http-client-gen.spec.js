const {mapLocalImport, formatMessagesCode} = require('./http-client-gen');
const {expect} = require('chai');

describe('http-client-gen', () => {

  it('should map local import to name & namespace', () => {

    const result = mapLocalImport('local.name', {
      namespace: 'namespace-1',
      name: 'name'
    });

    expect(result).to.deep.equal({
      namespace: 'namespace-1',
      name: 'local.name'
    });
  });

  it('should map exported import to name & namespace', () => {

    const result = mapLocalImport('name', {
      namespace: 'namespace-1',
      name: 'name',
      exports: {
        '@scope/source-package': {
          pathInPackage: 'exported-dir'
        }
      }
    });

    expect(result).to.deep.equal({
      name: 'name',
      packageName: '@scope/source-package/exported-dir/namespace-1/name'
    });
  });
});
