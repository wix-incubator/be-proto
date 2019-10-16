import * as fetch from 'node-fetch';
import {expect} from 'chai';
import * as beServer from '@wix/be-server';
import {Get, get} from '../target/test-output/simple-proto-service/test/MessageService.Get';
import {Message} from '../target/test-output/simple-proto-service/test/Message';
import 'mocha';

describe('http-client-gen', function() {

  let server: beServer.Server;

  const globalAny:any = global;

  before(() => globalAny.fetch = fetch);
  after(() => delete globalAny.fetch);

  before(async() => {
    server = await beServer.builder()
      .withBindings([{
        binding: Get,
        invoke: (message: Message): Message => message
      }])
      .start({ port: 9901 });
  });

  after(() => server.stop());

  it('should generate an http fetch client', async() => {
    const result = await get({
      name: 'John',
      stringValue: 'Hello'
    }, {
      baseUrl: 'http://localhost:9901',
      fetch
    });

    expect(result).to.deep.equal({
      name: 'John',
      stringValue: 'Hello'
    });
  });
});
