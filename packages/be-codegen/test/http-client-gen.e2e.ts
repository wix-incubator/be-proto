import * as fetch from 'node-fetch';
import {expect} from 'chai';
import * as beServer from '@wix/be-server';
import {Get} from '../target/test-output/simple-proto-service/test/MessageService.Get';
import {Message} from '../target/test-output/simple-proto-service/test/Message';

export interface Global {
  fetch: any;
}

declare var global: Global;

describe.only('http-client-gen', function() {

  let server: beServer.Server;

  before(() => global.fetch = fetch);
  after(() => delete global.fetch);

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
    // const dir = path.resolve(__dirname, 'fixtures/simple-proto-service');
    // const targetDir = path.resolve(__dirname, '../target/test-output/simple-proto-service');
    // const extra = path.resolve(__dirname, 'proto');
    // const genResult = await main(['http-client', '--work-dir', dir, '--extra', extra, '--output', targetDir,
    //   'test.MessageService']);

    const result = await Get({
      name: 'John'
    }, {
      baseUrl: 'http://localhost:9901'
    });

    expect(result).to.deep.equal({
      name: 'John'
    });
  });
});
