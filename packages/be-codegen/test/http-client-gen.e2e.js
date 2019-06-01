const path = require('path');
const {main} = require('..');
const {expect} = require('chai');
const fetch = require('node-fetch');
const beServer = require('@wix/be-server');

describe('http-client-gen', function() {

  let server;

  before(() => global.fetch = fetch);
  after(() => delete global.fetch);

  before(async() => {
    server = await beServer.builder()
      .withBindingsSource(beServer.fromProtoModules({
        contextDir: path.resolve(__dirname, 'fixtures/simple-proto-service'),
        extraPackages: [path.resolve(__dirname, 'proto')]
      }, {
        'test.MessageService': {
          get: (message) => message
        }
      }))
      .start({ port: 9901 });
  });

  after(() => server.stop());

  it('should generate an http fetch client', async() => {
    const dir = path.resolve(__dirname, 'fixtures/simple-proto-service');
    const targetDir = path.resolve(__dirname, '../target/test-output/simple-proto-service');
    const extra = path.resolve(__dirname, 'proto');
    const genResult = await main(['http-client', '--work-dir', dir, '--extra', extra, '--output', targetDir,
      'test.MessageService']);

    expect(genResult.stdout).to.include('Message');
    expect(genResult.stdout).to.include('MessageService.Get');

    const {Get} = require(path.resolve(targetDir, 'test', 'MessageService.Get'));

    const result = await Get({
      name: 'John'
    }, {
      baseUrl: 'http://localhost:9901'
    });

    expect(result).to.deep.equal({
      name: 'John'
    });
  });
});
