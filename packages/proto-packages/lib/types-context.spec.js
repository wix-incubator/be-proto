const {expect} = require('chai');
const path = require('path');
const {createTypesContext, typesContext} = require('./types-context');
const {create: createContext} = require('./protobuf-idl-context');
const protobuf = require('protobufjs');

describe('types-context', () => {

  it('should return a single cycle group', () => {
    const givenProto = protobuf.parse(`
      syntax = "proto3";

      message TestMessage {
        string test_value = 1;
      }
    `);

    const givenTypes = createTypesContext(givenProto.root, [givenProto.root.TestMessage]);

    expect(givenTypes.resolveCycleGroups()[0]).to.deep.equal([givenProto.root.TestMessage]);
  });

  it('should return a compound cycle group', () => {
    const givenProto = protobuf.parse(`
      syntax = "proto3";

      message TestMessage {
        TestMessage msg = 1;
        NestedMessage nested_msg = 2;
      }

      message NestedMessage {
        TestMessage test_msg = 1;
      }
    `);

    const givenTypes = createTypesContext(givenProto.root, [
      givenProto.root.TestMessage,
      givenProto.root.NestedMessage]);

    expect(givenTypes.resolveCycleGroups()[0]).to.deep.equal([givenProto.root.TestMessage, givenProto.root.NestedMessage]);
  });

  it('should return complex cycle groups', () => {
    const givenProto = protobuf.parse(`
      syntax = "proto3";

      message TestMessage {
        IntermediateNestedMessage intermediate_msg = 2;
      }

      message IntermediateNestedMessage {
        NestedMessage nested_msg = 1;
      }

      message FreeMessage {
        string test_value = 1;
      }

      message NestedMessage {
        TestMessage test_msg = 1;
      }
    `);

    const givenTypes = createTypesContext(givenProto.root, [
      givenProto.root.TestMessage,
      givenProto.root.NestedMessage,
      givenProto.root.IntermediateNestedMessage,
      givenProto.root.FreeMessage]);

    const groups = givenTypes.resolveCycleGroups();

    expect(groups).to.have.length(2);
    expect(groups[0]).to.have.length(3);
    expect(groups[1]).to.have.length(1);
  });
});
