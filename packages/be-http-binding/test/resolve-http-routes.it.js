const {resolveHttpRoutes} = require('..');
const protobuf = require('protobufjs');
const path = require('path');
const {expect} = require('chai');

describe('resolveHttpRoutes', () => {

  const givenProto = protobuf.loadSync(path.join(__dirname, 'proto/test-service.proto'));

  it('should resolve HTTP routes', () => {
    const testService = givenProto.root.nested.test.TestService;
    const routes = resolveHttpRoutes(testService);

    expect(Object.keys(routes)).to.have.length(2);
    expect(routes.Get).to.deep.equal({
      get: ['/api/messages']
    });
    expect(routes.GetNoHttp).to.deep.equal({});
  });
});
