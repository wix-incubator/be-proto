#!/usr/bin/env UV_THREADPOOL_SIZE=128 node

const {main} = require('..');

main(process.argv.slice(2))
  .then(({stdout}) => console.log(stdout));
