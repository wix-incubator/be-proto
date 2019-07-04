const codegen = require('.');
const {expect} = require('chai');

describe('http-client/codegen', () => {

  describe('google.protobuf', () => {

    ['StringValue', 'DoubleValue', 'FloatValue', 'Int64Value', 'UInt64Value', 'Int32Value',
     'UInt32Value', 'BoolValue', 'StringValue', 'BytesValue'].forEach(typeName => {
      it(`should export a well-known-type google.protobuf.${typeName}`, () => {
        expect(codegen.getImport(null, typeName)).to.deep.equal({
          name: typeName,
          packageName: '@wix/be-http-client'
        });
      });
    });
  });
});
