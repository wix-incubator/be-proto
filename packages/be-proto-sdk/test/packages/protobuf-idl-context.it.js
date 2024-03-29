const {create} = require('..');
const path = require('path');
const {expect} = require('chai');

describe('Protobuf IDL context', function() {

  this.timeout(10000);

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
    expect((await givenContext.files()).join()).to.not.include('ignored.proto');
  });

  it('should lookup dependency types', async() => {
    const givenContext = aContext('package-with-proto-dependency');

    const typesContext = await givenContext.queryTypesFor(['test.NestedMessage']);
    const types = typesContext.types;

    expect(types[0].name).to.equal('NestedMessage');
    expect(types[1].name).to.equal('Message1');
    expect(types[2].name).to.equal('Message');
  });

  it('should lookup with transitive deps', async() => {
    const givenContext = aContext('transitive-deps');

    const typesContext = await givenContext.queryTypesFor(['level0.Message']);

    expect(typesContext.types).to.have.length(4);
  });

  it('should lookup service types', async() => {
    const givenContext = aContext('package-with-proto-dependency');

    const typesContext = await givenContext.queryTypesFor(['test.TestService']);
    const types = typesContext.types;

    expect(types).to.have.length(6);
    expect(types[0].name).to.equal('TestService');
    expect(types[1].name).to.equal('NestedMessage');
    expect(types[2].name).to.equal('OtherMessage');
    expect(types[3].name).to.equal('Message1');
    expect(types[4].name).to.equal('Message');
    expect(types[5].name).to.equal('UsedByOther');
  });

  it('should lookup dependency files', async() => {
    const givenContext = aContext('package-with-proto-dependency');

    const files = await givenContext.files();

    expect(files.join()).to.include('used-by-other.proto');
    expect(files.join()).to.include('custom-field-options.proto');
  });

  it('should resolve name', async() => {
    const givenContext = aContext('package-with-proto-dependency');

    const type = await givenContext.lookupType('test.NestedMessage');

    const result = await givenContext.resolve(type, 'dep.test.Message');

    expect(result).to.deep.equal({
      exports: {},
      name: 'Message',
      namespace: 'dep.test',
      fullyQualifiedName: 'dep.test.Message'
    });
  });

  it('should find type exports', async() => {
    const givenContext = aContext('package-with-proto-exports');

    const type = await givenContext.lookupType('test.NestedMessage');
    const typeMeta = await givenContext.resolve(type, 'dep.test.Message');

    expect(typeMeta.exports).to.deep.equal({
      '@wix/exporting-package': {
        target: 'target-1',
        pathInPackage: 'exported-dir'
      }
    });
  });

  it('should fail resolve name', async() => {
    const givenContext = aContext('package-with-proto-dependency');

    const type = await givenContext.lookupType('test.NestedMessage');

    let error;

    try {
     await givenContext.resolve(type, 'test.Unknown');
    } catch(e) {
      error = e;
    }

    expect(error).to.instanceOf(Error);
    expect(error.message).to.include(`Unknown type "test.Unknown"`);
  });

  function aContext(contextName) {
    return create({
      contextDir: path.join(__dirname, `fixtures/${contextName}`),
      packagesDirName: 'deps',
      extraPackages: [path.join(__dirname, 'proto')]
    });
  }
});
