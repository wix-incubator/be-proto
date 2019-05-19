const {generateMessageUnit} = require('./message-generator');
const protobuf = require('protobufjs');
const {expect} = require('chai');
const _ = require('lodash');

describe('message-generator', () => {

  it('should generate a message', () => {
    const givenProto = protobuf.parse(`
      syntax = "proto3";

      message TestMessage {
        string test_value = 1;
        repeated int64 test_values = 2;
      }
    `);

    const generatedMessage = generateMessageUnit(givenProto.root.TestMessage);

    expect(generatedMessage.js.code).to.include(`.field('testValue', string, 1)`);
    expect(generatedMessage.js.code).to.include(`.repeated('testValues', int64, 2)`);

    expect(_.sortBy(Object.keys(generatedMessage.js.refs))).to.deep.equal(['MessageBuilder', 'int64', 'string']);
    expect(generatedMessage.js.refs.MessageBuilder).to.deep.equal({
      source: 'be-proto:runtime',
      id: 'MessageBuilder'
    });
  });

  it('should generate a message with oneof', () => {
    const givenProto = protobuf.parse(`
      syntax = "proto3";

      message TestMessage {
        oneof value {
          string test_value = 1;
          int32 test_int_value = 2;
        }
      }
    `);

    const generatedMessage = generateMessageUnit(givenProto.root.TestMessage);

    expect(generatedMessage.js.code).to.include(`.field('testValue', string, oneOf('value', 1)`);
    expect(generatedMessage.js.code).to.include(`.field('testIntValue', int32, oneOf('value', 2))`);
    expect(generatedMessage.js.refs.oneOf).to.exist;
  });
});
