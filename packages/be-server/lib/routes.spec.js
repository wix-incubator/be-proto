const routes = require('./routes');
const {expect} = require('chai');
const {httpBinding, messageBuilder, wellKnownTypes} = require('@wix/be-http-binding');
const {http, get} = httpBinding;

describe('Routes', () => {

  const echoMessage = messageBuilder().field('message', wellKnownTypes.string, 1).build();

  it('should match a GET route', async() => {
    const givenBinding = http(get('/echo'), echoMessage, echoMessage);
    const givenRoutes = routes([
      givenBinding.bind((message) => message)
    ]);

    const {request, invoke} = givenRoutes.resolve('GET', '/echo?message=Hello');

    expect(request).to.deep.equal({
      message: 'Hello'
    });

    expect(invoke).to.exist;
    expect(await invoke(request)).to.deep.equal(request);
  });

  it('should match and resolve values in URI', async() => {
    const givenMessage = messageBuilder()
      .field('valueFromPath', wellKnownTypes.string, 1)
      .field('valueFromQuery', wellKnownTypes.string, 2)
      .build();

    const givenBinding = http(get('/api/{valueFromPath}'), givenMessage, givenMessage);

    const givenRoutes = routes([
      givenBinding.bind((message) => message)
    ]);

    const {request, invoke} = givenRoutes.resolve('GET', '/api/path-1?valueFromQuery=query-1');

    expect(request).to.deep.equal({
      valueFromPath: 'path-1',
      valueFromQuery: 'query-1'
    });

    expect(invoke).to.exist;
    expect(await invoke(request)).to.deep.equal(request);
  });

  it('should extract complex request arguments', () => {
    const givenMessage = messageBuilder().build();

    const givenBinding = http(get('/api/{valueFromPath}'), givenMessage, givenMessage);

    const givenRoutes = routes([
      givenBinding.bind((message) => message)]);

    const {request, invoke} = givenRoutes.resolve('GET', '/api/path-1?test.arr=arr-1&test.arr=arr-2&test.bool=true&num=10');

    expect(invoke).to.exist;
    expect(request).to.deep.equal({
      test: {
        arr: ['arr-1', 'arr-2'],
        bool: 'true'
      },
      num: '10',
      valueFromPath: 'path-1'
    });
  });
});
