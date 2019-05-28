const {generateMessageUnit, generateEnum} = require('./message-generator');
const protobuf = require('protobufjs');
const {expect} = require('chai');
const _ = require('lodash');

describe('message-generator', () => {

  it('should generate a message', () => {
    const givenProto = protobuf.parse(`
      syntax = "proto3";

      package a.test;

      message TestMessage {
        string test_value = 1;
        repeated int64 test_values = 2;
      }
    `);

    const generatedMessage = generateMessageUnit(givenProto.root.nested.a.nested.test.TestMessage);

    expect(generatedMessage.js.code).to.include(`MessageBuilder`);
    expect(generatedMessage.namespace).to.equal('a.test');
    expect(generatedMessage.name).to.equal('TestMessage');
    expect(generatedMessage.js.code).to.include(`.field('testValue', string, 1)`);
    expect(generatedMessage.js.code).to.include(`.repeated('testValues', int64, 2)`);

    expect(_.sortBy(Object.keys(generatedMessage.js.refs))).to.deep.equal(['MessageBuilder', 'int64', 'string']);
    expect(generatedMessage.js.refs.MessageBuilder).to.deep.equal({
      id: 'MessageBuilder',
      source: null
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

  it('should reference another message', () => {
    const givenProto = protobuf.parse(`
      syntax = "proto3";

      message TestMessage {
        TestMessage2 msg = 1;
      }

      message TestMessage2 {
        TestMessage msg = 1;
      }
    `);

    const generatedMessage = generateMessageUnit(givenProto.root.TestMessage);

    expect(generatedMessage.js.code).to.include(`MessageBuilder`);
    expect(generatedMessage.js.code).to.include(`.field('msg', TestMessage2, 1)`);

    expect(generatedMessage.js.refs.TestMessage2).to.deep.equal({
      id: 'TestMessage2',
      source: givenProto.root.TestMessage
    });
    expect(generatedMessage.js.refs.MessageBuilder).to.deep.equal({
      id: 'MessageBuilder',
      source: null
    });
  });

  it('should reference another message on an explicit namespace', () => {
    const givenProto = protobuf.parse(`
      syntax = "proto3";

      package a;

      message TestMessage {
        a.TestMessage2 msg = 1;
      }

      message TestMessage2 {
        TestMessage msg = 1;
      }
    `);

    const generatedMessage = generateMessageUnit(givenProto.root.nested.a.TestMessage);

    expect(generatedMessage.js.code).to.include(`MessageBuilder`);
    expect(generatedMessage.js.code).to.include(`.field('msg', TestMessage2, 1)`);

    expect(generatedMessage.js.refs['a.TestMessage2']).to.deep.equal({
      id: 'a.TestMessage2',
      name: 'TestMessage2',
      source: givenProto.root.nested.a.TestMessage
    });
    expect(generatedMessage.js.refs.MessageBuilder).to.deep.equal({
      id: 'MessageBuilder',
      source: null
    });
  });

  it('should generate int enum', () => {
    const givenProto = protobuf.parse(`
      syntax = "proto3";

      enum TestEnum {
        A = 0;
        B = 1;
      }
    `);

    const generatedMessage = generateEnum(givenProto.root.nested.TestEnum);

    expect(generatedMessage.js.code).to.include(`EnumBuilder`);
    expect(generatedMessage.js.code).to.include(`.value('A', 0)`);
    expect(generatedMessage.js.code).to.include(`.value('B', 1)`);
  });

  it('should generate nested objects', () => {
    const givenProto = protobuf.parse(`
      syntax = "proto3";

      message TestMessage {
        message TestNestedMessage {
          string id = 1;
        }

        enum TestEnum {
          A = 0;
          B = 1;
        }

        TestNestedMessage msg = 1;
        TestEnum enm = 2;
      }
    `);

    const generatedMessage = generateMessageUnit(givenProto.root.nested.TestMessage);

    expect(generatedMessage.nested.TestNestedMessage.js.code).to.include(`MessageBuilder`);
    expect(generatedMessage.nested.TestEnum.js.code).to.include(`EnumBuilder`);
    expect(generatedMessage.js.refs.TestNestedMessage).to.deep.equal({
      id: 'TestNestedMessage',
      source: givenProto.root.nested.TestMessage
    });
    expect(generatedMessage.js.refs.TestEnum).to.exist;
  });
});
