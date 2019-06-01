const {expect} = require('chai');
const messageTypes = require('./message-types');
const protobuf = require('protobufjs');

describe('message-types', () => {

  it('should create a message type from pb', () => {
    const givenProto = protobuf.parse(`
      syntax = "proto3";

      package test;

      message TestMessage {
        string test_value = 1;
      }
    `);

    const givenMessageTypes = messageTypes(givenProto.root);

    const messageType = givenMessageTypes.lookup('test.TestMessage');

    expect(messageType.fromValue({
      testValue: 'Hello'
    })).to.deep.equal({
      testValue: 'Hello'
    });
  });
});
