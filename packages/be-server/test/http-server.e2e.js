const beServer = require('..');
const fetch = require('node-fetch');
const {expect} = require('chai');
const path = require('path');

describe('HTTP server', function() {

  this.timeout(10000);

  let server;

  before(async() => {
    server = await beServer.builder()
      .withContextDir(path.resolve(__dirname, '..'))
      .withExtraProtoPackage(path.resolve(__dirname, 'proto'))
      .withService('test.EchoService', {
        echo: (message) => message
      })
      .start({ port: 9901 });
  });

  after(() => server.stop());

  it('should call to an exposed endpoint', async() => {
    const response = await fetch('http://localhost:9901/api/echo?message=Hello');

    expect(response.status).to.equal(200);

    const body = await response.json();

    expect(body).to.deep.equal({
      message: 'Hello'
    });
  });
});
