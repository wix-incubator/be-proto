const {httpClientGen} = require('../lib/http-client-gen');
const {create} = require('@wix/proto-packages');
const path = require('path');
const {expect} = require('chai');

require('chai').use(require('chai-things'));

describe('http-client-gen', () => {

  it('should output a message with imports', async() => {
    const givenContext = create({
      contextDir: path.join(__dirname, 'fixtures/simple-proto'),
      packagesDirName: 'deps',
      extraPackages: [path.join(__dirname, 'proto')]
    });

    const clientGen = httpClientGen(givenContext);
    const output = testOutput();

    clientGen.generate(['test.NestedMessage'], output);

    await output.done();

    const entry = output.entryFor('test.NestedMessage');

    expect(entry.namespace).to.equal('test');
    expect(entry.name).to.equal('NestedMessage');
    expect(entry.js.imports).to.include.something.that.deep.equals({
      name: 'Message',
      namespace: 'test'
    });

    expect(output.entryFor('test.Message').js.imports).to.include.something.that.deep.equals({
      name: 'string',
      packageName: '@wix/be-http-client'
    });
    expect(output.entryFor('be-proto').json).to.have.property('@wix/be-http-client');
  });

  it.only('should output a circular message', async() => {
    const givenContext = create({
      contextDir: path.join(__dirname, 'fixtures/complex-proto-messages'),
      packagesDirName: 'deps',
      extraPackages: [path.join(__dirname, 'proto')]
    });

    const clientGen = httpClientGen(givenContext);
    const output = testOutput();

    clientGen.generate(['test.CircularMessage'], output);

    await output.done();

    const entry = output.entryFor('test.agg_CircularMessage_NestedCircularMessage');

    expect(entry.namespace).to.equal('test');

    const proxyEntry = output.entryFor('test.CircularMessage');

    expect(proxyEntry.js.imports).to.include.something.that.deep.equals({
      name: 'CircularMessage',
      packageName: './agg_CircularMessage_NestedCircularMessage'
    });
  });

  function testOutput() {
    let fulfillCallback, rejectCallback;

    const completePromise = new Promise((fulfill, reject) => {
      fulfillCallback = fulfill;
      rejectCallback = reject;
    });

    const entries = {};

    return {
      add(entry) {
        const name = entry.namespace ? `${entry.namespace}.${entry.name}` : entry.name;

        console.log('== ADD', name);

        entries[name] = entry;
      },
      complete() {
        fulfillCallback();
      },
      error(e) {
        rejectCallback(e);
      },
      async done() {
        await completePromise;
      },
      entryFor(name) {
        const entry = entries[name];

        if (!entry) {
          throw new Error(`Entry not found for ${name}. Available: ${Object.keys(entries).join(', ')}`);
        }

        return entry;
      }
    };
  }
});
