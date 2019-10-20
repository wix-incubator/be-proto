import chai from 'chai';
import {expect} from 'chai';
import 'mocha';
import {ServerLauncher, Server} from '@wix/be-server';
import {echo} from '../be-client/test/TypesService.Echo';
import {AllTypes} from '../be-client/test/AllTypes';
import {LongValue} from '@wix/be-http-client';
import * as fetch from 'node-fetch';
import chaiSubset from 'chai-subset';

chai.use(chaiSubset);

describe('Proto client-server', () => {

  let server: Server;

  before(async() => server = await ServerLauncher.embedded(() => require('..'), {
    port: 9901
  }));
  after(() => server.stop());

  it('should run a server and get a response', async () => {
    const givenRequest = {
      optionalInt32: 1,
      optionalInt64: 2
    } as AllTypes;

    const response = await echo(givenRequest, {
      fetch,
      baseUrl: 'http://localhost:9901'
    });

    expect(response).to.containSubset({
      optionalInt32: 1,
      optionalInt64: LongValue.fromValue('2')
    });
  });
});
