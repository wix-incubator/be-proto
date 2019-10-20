const {ServerLauncher} = require('..');
const fetch = require('node-fetch');
const {expect} = require('chai');

describe('Server launcher', async() => {

  let server;

  before(() => ServerLauncher.embedded(() => require('./test-server'), {
    port: 9910
  }).then((instance) => server = instance));

  after(() => server.stop());

  it('should call a started server', async() => {
    const resp = await fetch('http://localhost:9910', {
      method: 'OPTIONS'
    });

    expect(resp.status).to.equal(204);
  });
});
