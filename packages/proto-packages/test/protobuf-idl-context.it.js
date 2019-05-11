const {create} = require('..');
const path = require('path');
const {expect} = require('chai');

describe('Protobuf IDL context', () => {

  it('should load protobuf IDL', async() => {
    const givenContext = create({
      contextDir: path.join(__dirname, 'fixtures/package-with-proto-in-deps'),
      packagesDirName: 'deps'
    });

    const TestMessage = await givenContext.lookupType('test.Message');

    expect(TestMessage.create({ name: 'John' }).name).to.equal('John');
  });

  it('should load proto from source root', async() => {
    const givenContext = create({
      contextDir: path.join(__dirname, 'fixtures/independent-package-with-proto'),
      sourceRoots: ['here-be-proto']
    });

    const TestMessage = await givenContext.lookupType('test.Message');

    expect(TestMessage.create({ name: 'John' }).name).to.equal('John');
  });

  it('should lookup dependency types', async() => {
    const givenContext = create({
      contextDir: path.join(__dirname, 'fixtures/package-with-proto-dependency'),
      packagesDirName: 'deps'
    });

    const types = await givenContext.queryTypesFor(['test.NestedMessage']);

    expect(types[0].name).to.equal('NestedMessage');
    expect(types[1].name).to.equal('Message1');
    expect(types[2].name).to.equal('Message');
  });

  it('should lookup dependency files', async() => {
    const givenContext = create({
      contextDir: path.join(__dirname, 'fixtures/package-with-proto-dependency'),
      packagesDirName: 'deps'
    });

    const files = await givenContext.queryFilesFor(['test.NestedMessage']);

    expect(files).to.have.length(3);
  });
});
