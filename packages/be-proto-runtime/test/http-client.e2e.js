const {httpBinding, messageBuilder, wellKnownTypes} = require('../http');
const beServer = require('../server');
const fetch = require('node-fetch');
const {fetchInvoker} = require('..');
const {expect} = require('chai');
const {http, get} = httpBinding;

describe('http-client', function() {

  this.timeout(10000);

  const echoMessage = messageBuilder().field('message', wellKnownTypes.string, 1).build();
  const getEcho = http(get('/echo'), echoMessage, echoMessage, {
    invoker: fetchInvoker(fetch),
    baseUrl: 'http://localhost:9901'
  });

  let server;

  before(async() => {
    server = await beServer.builder()
      .withBindings(getEcho.bind((message) => message))
      .start({ port: 9901 });
  });

  after(() => server.stop());

  it('should call a server', async() => {
    const result = await getEcho.invoke({
      message: 'Hello'
    });

    expect(result).to.deep.equal({
      message: 'Hello'
    });
  });
});
