# Bè Proto

### <span style="color:red">Very alpha and very WIP.</span>

Library and code generator for Protobuf HTTP binding ([google/api/http.proto](https://github.com/googleapis/googleapis/blob/master/google/api/http.proto)), or some [docs](https://cloud.google.com/endpoints/docs/grpc/transcoding).


## Hello World

Add a proto file to your NPM package or one that you depend upon.

```
- proto
  - hello-service.proto
- package.json
```


hello.proto
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

Install: `npm install --dev @wix/be-codegen`

Add to `package.json`

```json
{
  "scripts": {
    "build": "be http-client --output ./be-client hello.HelloService"
  }
}
```

Run: `npm run build`

### Use the generated code

Install: `npm install --dev @wix/be-http-client`

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

const beServer = require('@wix/be-server');

const server = await beServer.builder()
  .withBindings([{
    binding: Greet,
    invoke: (message) => message
  }])
  .start({ port: 9901 });


const {message} = await greet({
  message: 'Hello!'
}, {
  baseUrl: 'http://localhost:9901'
});

console.log(message); // prints "Hello!"
```

### Proto-less

Install: `npm install --dev @wix/be-http-client`

```javascript

  const {http, get, messageBuilder, string} = require('@wix/be-http-client');
  const {beServer} = require('@wix/be-server');

  const echoMessage = messageBuilder()
    .field('message', string, 1)
    .build();

  const getEcho = http(get('/echo'), echoMessage, echoMessage, {
    fetch, // optionally provide your own fetch
    baseUrl: 'http://localhost:9901'
  });

  const server = await beServer.builder()
    .withBindings([{
      binding: getEcho,
      invoke: (message) => message
    }])
    .start({ port: 9901 });

  const {message} = await getEcho.invoke({
    message: 'Hello!'
  }, {
    baseUrl: 'http://localhost:9901'
  });
```
