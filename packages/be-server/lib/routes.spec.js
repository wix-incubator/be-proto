const routes = require('./routes');
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

      const {request, method} = givenRoutes.resolve('GET', '/api/path-1?valueFromQuery=query-1');

      expect(method.name).to.equal('Get');
      expect(request).to.deep.equal({
        valueFromPath: 'path-1',
        valueFromQuery: 'query-1'
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
    })));
  }
});
