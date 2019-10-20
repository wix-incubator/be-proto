const beServer = require('..');
const fetch = require('node-fetch');
const {expect} = require('chai');
const path = require('path');
const {httpBinding, messageBuilder, wellKnownTypes} = require('@wix/be-http-binding');
const {http, get} = httpBinding;

describe('HTTP server', function() {

  this.timeout(10000);

  let server;

  const echoMessage = messageBuilder().field('message', wellKnownTypes.string, 1).build();

  before(async() => {
    server = await beServer.builder()
      .withBindingsSource(beServer.fromProtoModules({
        contextDir: path.resolve(__dirname, '..'),
        extraPackages: [path.resolve(__dirname, 'proto')]
      }, {
        'test.EchoService': {
          echo: (message) => message,
          postEcho: (message) => message,
          typesEcho: (message) => message,
        }
      }))
      .withBindings(
        http(get('/api/dynamic-echo'), echoMessage, echoMessage).bind((message) => message))
      .start({ port: 9901 });
  });

  after(() => server.stop());

  it('should call an exposed endpoint', async() => {
    const response = await fetch('http://localhost:9901/api/echo?message=Hello');

    expect(response.status).to.equal(200);

    const body = await response.json();

    expect(body).to.deep.equal({
      message: 'Hello'
    });
  });

  it('should call a dynamic endpoint', async() => {
    const response = await fetch('http://localhost:9901/api/dynamic-echo?message=Hello');

    expect(response.status).to.equal(200);

    const body = await response.json();

    expect(body).to.deep.equal({
      message: 'Hello'
    });
  });

  it('should post', async() => {
    const response = await fetch('http://localhost:9901/api/echo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: 'Hello' })
    });

    expect(response.status).to.equal(200);

    const body = await response.json();

    expect(body).to.deep.equal({
      message: 'Hello'
    });
  });

  it('should post typed message', async() => {
    const response = await fetch('http://localhost:9901/api/echo/i-am-a-string?int=99', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ nested: {
        message: 'Hello'
      }})
    });

    expect(response.status).to.equal(200);

    const body = await response.json();

    expect(body).to.deep.equal({
      int: 99,
      str: 'i-am-a-string',
      nested: {
        message: 'Hello'
      }
    });
  });
});
