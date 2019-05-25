const path = require('path');
const {main} = require('..');
const {expect} = require('chai');

describe('http-client', function() {

  it('should generate an http fetch client', async() => {
    const dir = path.resolve(__dirname, 'fixtures/simple-proto-service');
    const targetDir = path.resolve(__dirname, '../target/test-output/simple-proto-service');
    const extra = path.resolve(__dirname, 'proto');
    const result = await main(['http-client', '--work-dir', dir, '--extra', extra, '--output', targetDir,
      'test.MessageService']);

    expect(result.stdout).to.include('Message');
    expect(result.stdout).to.include('MessageService.Get');
  });
});
