# Bè Proto

### **WARNING**: <span style="color:red">Very alpha and very WIP.</span>

Library and code generator for Protobuf HTTP binding ([google/api/http.proto](https://github.com/googleapis/googleapis/blob/master/google/api/http.proto)), or some [docs](https://cloud.google.com/endpoints/docs/grpc/transcoding).


## Hello World Project set-up

Add a proto file to your NPM package or one that you depend upon.

File structure:
```
- proto
  - hello-service.proto
- package.json
```


proto/hello-service.proto
```proto
syntax = "proto3";

package hello;

import "google/api/http.proto";

service HelloService {
    rpc Greet (Message) returns (Message) {
        option (google.api.http) = {
          get: "/api/greetings"
        };
    }
}

message Message {
  string message = 1;
}
```

### Code generation

Install: `npm add --dev be-proto-sdk`

Add to `package.json`

```json
{
  "scripts": {
    "build": "be-codegen http-client --output ./be-client hello.HelloService"
  }
}
```

Run: `npm run build`

### Use the generated code

Install: `npm add --dev be-proto-runtime`

```javascript

const {greet} = require('./be-client/hello/HelloService.Greet');

const {message} = await greet({
  message: 'Hello!'
});

console.log(message); // prints "Hello!"
```

### Using as a server

```javascript

const {Greet, greet} = require('./be-client/hello/HelloService.Greet';

const beServer = require('be-proto-runtime/server');

const server = await beServer.builder()
  .withBindings(Greet.bind((message) => message))
  .start({ port: 9901 });


const {message} = await greet({
  message: 'Hello!'
}, {
  baseUrl: 'http://localhost:9901'
});

console.log(message); // prints "Hello!"
```

### Proto-less

Install: `npm add --dev be-proto-runtime`

```javascript

  const {http, get, messageBuilder, string} = require('be-proto-runtime/http');
  const beServer = require('be-proto-runtime/server');

  const echoMessage = messageBuilder()
    .field('message', string, 1)
    .build();

  const getEcho = http(get('/echo'), echoMessage, echoMessage, {
    fetch, // optionally provide your own fetch
    baseUrl: 'http://localhost:9901'
  });

  const server = await beServer.builder()
    .withBindings(getEcho.bind((message) => message))
    .start({ port: 9901 });

  const {message} = await getEcho.invoke({
    message: 'Hello!'
  }, {
    baseUrl: 'http://localhost:9901'
  });
```
