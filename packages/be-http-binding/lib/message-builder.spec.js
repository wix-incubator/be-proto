const {messageBuilder} = require('./message-builder');
const {string, int32} = require('./well-known-types');
const {expect} = require('chai');
const _ = require('lodash');

describe('message-builder', () => {

  it('should read a simple message', () => {
    const message = messageBuilder()
      .field('name', string, 1)
      .build();

    expect(message.fromValue({
      name: 'John',
      irrelevantField: true
    })).to.deep.equal({
      name: 'John'
    });
  });

  it('should read a simple message with repeated field', () => {
    const message = messageBuilder()
      .repeated('names', string, 1)
      .build();

    expect(message.fromValue({
      names: ['John', 'Jane']
    })).to.deep.equal({
      names: ['John', 'Jane']
    });
  });

  it('should single field as repeated', () => {
    const message = messageBuilder()
      .repeated('names', string, 1)
      .build();

    expect(message.fromValue({
      names: 'John'
    })).to.deep.equal({
      names: ['John']
    });
  });

  it('should add field modifier', () => {
    const message = messageBuilder()
      .repeated('values', int32, 1)
      .field('sum', int32, sumOf('values'))
      .build();

    expect(message.fromValue({
      values: [1, 2]
    })).to.deep.equal({
      values: [1, 2],
      sum: 3
    });
  });

  function sumOf(fieldName) {
    return {
      value(message) {
        return _.sum(message[fieldName]);
      }
    };
  }
});
