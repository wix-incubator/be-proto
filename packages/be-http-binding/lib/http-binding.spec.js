const {http, get, post, put} = require('./http-binding');
const {messageBuilder} = require('./message-builder');
const {int32} = require('./builtin-types');
const {expect} = require('chai');
const url = require('url');
const querystring = require('querystring');
const UrlPattern = require('url-pattern');

describe('http-binding', () => {
  const message = messageBuilder()
    .field('a', int32, 1)
    .field('b', int32, 2)
    .build();

  let invoker;

  beforeEach(() => {
    invoker = testInvoker(handleInvoke.bind(this, null));
  });

  it('should invoke a GET method', async() => {
    const givenMethod = http(get('/pass'), message, message, {invoker});

    const result = await givenMethod.invoke({
      a: 1
    });

    expect(result).to.deep.equal({
      a: 1,
      b: 0
    });

    expect(invoker.invocations()).to.have.length(1);
    expect(invoker.invocations()[0]).to.deep.equal({
      method: 'get',
      uri: '/pass?a=1',
      message: undefined
    });
  });

  it('should invoke the GET method with multiple values', async() => {
    const givenMethod = http(get('/pass'), message, message, {invoker});

    const result = await givenMethod.invoke({
      a: 1,
      b: 2
    });

    expect(result).to.deep.equal({
      a: 1,
      b: 2
    });

    expect(invoker.invocations()).to.have.length(1);
    expect(invoker.invocations()[0]).to.deep.equal({
      method: 'get',
      uri: '/pass?a=1&b=2',
      message: undefined
    });
  });

  it('should invoke a POST method', async() => {
    const givenMethod = http(post('/pass'), message, message, {invoker});

    const result = await givenMethod.invoke({
      a: 1
    });

    expect(result).to.deep.equal({
      a: 1,
      b: 0
    });

    expect(invoker.invocations()).to.have.length(1);
    expect(invoker.invocations()[0]).to.deep.equal({
      method: 'post',
      uri: '/pass',
      message: {
        a: 1,
        b: 0
      }
    });
  });

  it('should invoke a PUT method', async() => {
    const givenInvoker = testInvoker(handleInvoke.bind(this, new UrlPattern('/pass/:a')));
    const givenMethod = http(put('/pass/{a}'), message, message, {invoker: givenInvoker});

    const result = await givenMethod.invoke({
      a: 1,
      b: 2
    });

    expect(result).to.deep.equal({
      a: 1,
      b: 2
    });

    expect(givenInvoker.invocations()).to.have.length(1);
    expect(givenInvoker.invocations()[0]).to.deep.equal({
      method: 'put',
      uri: '/pass/1',
      message: {
        b: 2
      }
    });
  });

  it('should pass options to invoker', async() => {
    const givenMethod = http(get('/pass'), message, message, {invoker, methodOption: 'a'});

    await givenMethod.invoke({
      a: 1,
      b: 2
    }, {
      invocationOption: 'b'
    });

    const lastOptions = invoker.lastOptions();

    expect(lastOptions.methodOption).to.equal('a');
    expect(lastOptions.invocationOption).to.equal('b');
  });

  it('should return http routes', () => {
    const givenMethod = http(put('/pass/{a}'), message, message);

    expect(givenMethod.httpRoutes()).to.deep.equal([{
      method: 'put', path: '/pass/{a}'
    }]);
  });

  it('should create an invoke function', async() => {
    const invoke = http(put('/pass/{a}'), message, message).createInvoke((message) => message);

    expect(await invoke({a: 1})).to.deep.equal({a: 1, b: 0});
  });

  function testInvoker(fn) {
    const invocations = [];
    let lastOptions;

    return {
      invoke(request) {
        invocations.push({
          method: request.method,
          uri: request.uri,
          message: request.message
        });

        lastOptions = request.options;

        return fn(request);
      },
      lastOptions() {
        return lastOptions;
      },
      invocations() {
        return invocations;
      }
    };
  }

  function handleInvoke(urlPattern, request) {
    const uri = url.parse(request.uri);
    const valuesFromPath = urlPattern ? urlPattern.match(uri.pathname): {};
    const queryParams = uri.query ? querystring.parse(uri.query) : {};

    return request.message ? Object.assign(queryParams, valuesFromPath, request.message) : Object.assign(queryParams, valuesFromPath);
  }
});
