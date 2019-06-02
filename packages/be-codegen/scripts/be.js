#!/usr/bin/env UV_THREADPOOL_SIZE=128 node

const debug = require('debug')('be-script');

debug('Starting be-script', process.argv);

const {main} = require('..');

main(process.argv.slice(2))
  .then(({stdout}) => console.log(stdout))
  .catch((e) => console.error(e));
