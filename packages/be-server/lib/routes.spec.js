const routes = require('./routes');
const messageTypes = require('./message-types');
const {expect} = require('chai');
const protobufjs = require('protobufjs');

describe('Routes', () => {

  it('should match and resolve values in URI', () => {
    const givenRoutes = routesFrom(`
      service TestRoutes {
        rpc Get (Message) returns (Message) {
          option (google.api.http) = {
            get: "/api/{valueFromPath}"
          };
        }
      }

      message Message {
        string value_from_path = 1;
        string value_from_query = 2;
      }
    `);

      const {request, route} = givenRoutes.resolve('GET', '/api/path-1?valueFromQuery=query-1');

      expect(route.method.name).to.equal('Get');
      expect(request).to.deep.equal({
        valueFromPath: 'path-1',
        valueFromQuery: 'query-1'
      });
  });

  it('should extract complex request arguments', () => {
    const givenRoutes = routesFrom(`
      service TestRoutes {
        rpc Get (Empty) returns (Empty) {
          option (google.api.http) = {
            get: "/api/{valueFromPath}"
          };
        }
      }

      message Empty {}
    `);

    const {request, route} = givenRoutes.resolve('GET', '/api/path-1?test.arr=arr-1&test.arr=arr-2&test.bool=true&num=10');

    expect(route.method.name).to.equal('Get');
    expect(request).to.deep.equal({
      test: {
        arr: ['arr-1', 'arr-2'],
        bool: 'true'
      },
      num: '10',
      valueFromPath: 'path-1'
    });
  });

  function routesFrom(source) {
    const parsed = protobufjs.parse(`
      syntax = "proto3";

      package test;

      import "google/api/http.proto";

      ${source}
    `);

    const ns = parsed.root.nested.test;

    return routes(Object.values(ns.nested).filter((type) => type instanceof protobufjs.Service).map((service) => ({
      service
    })), messageTypes(parsed.root));
  }
});
