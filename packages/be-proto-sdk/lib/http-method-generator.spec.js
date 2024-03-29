const {generateMethod} = require('./http-method-generator');
const protobuf = require('protobufjs');
const {expect} = require('chai');

describe('http-method-generator', () => {

  it('should generate an HTTP method', () => {
    const givenProto = protobuf.parse(`
      syntax = "proto3";

      package test;

      import "wix/api/http.proto";

      service TestService {
        rpc Get (TestRequest) returns (TestResponse) {
            option (google.api.http) = {
              get: "/api/v1/test"
            };
        }
      }

      message TestRequest {
        string test_value = 1;
      }

      message TestResponse {
        string test_value = 1;
      }
    `);

    const generatedMethod = generateMethod(givenProto.root.nested.test.TestService.methods.Get);

    expect(generatedMethod.namespace).to.equal('test');
    expect(generatedMethod.name).to.equal('TestService.Get');
    expect(generatedMethod.exports.binding.js.code).to.include(`http(get('/api/v1/test'), TestRequest, TestResponse)`);
  });

  it('should generate an HTTP streaming method', () => {
    const givenProto = protobuf.parse(`
      syntax = "proto3";

      import "wix/api/http.proto";

      service TestService {
        rpc Stream (stream TestRequest) returns (stream TestResponse) {
            option (google.api.http) = {
              get: "/api/v1/test"
            };
        }
      }

      message TestRequest {
        string test_value = 1;
      }

      message TestResponse {
        string test_value = 1;
      }
    `);

    const generatedMethod = generateMethod(givenProto.root.TestService.methods.Stream);

    expect(generatedMethod.exports.binding.js.code).to.include(`http(get('/api/v1/test'), stream(TestRequest), stream(TestResponse))`);
  });
});
