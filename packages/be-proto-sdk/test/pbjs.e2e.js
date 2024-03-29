const path = require('path');
const {main} = require('..');
const {expect} = require('chai');

describe.skip('pbjs', function() {

  this.timeout(20000);

  it('should generate pbjs', async() => {
    const dir = path.resolve(__dirname, 'fixtures/simple-proto');
    const result = await main(['pbjs', '--work-dir', dir, 'test.Message', '--',
      '-t', 'static-module', '-w', 'commonjs']);

    expect(result.stdout).to.include('test.Message');
  });
});
