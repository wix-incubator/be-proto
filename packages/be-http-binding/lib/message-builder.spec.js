const {messageBuilder} = require('./message-builder');
const {string} = require('./well-known-types');
const {expect} = require('chai');

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

  it('should read a simple repeated message', () => {
    const message = messageBuilder()
      .repeated('names', string, 1)
      .build();

    expect(message.fromValue({
      names: ['John', 'Jane']
    })).to.deep.equal({
      names: ['John', 'Jane']
    });
  });
});
