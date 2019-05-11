#!/usr/bin/env node

const {main} = require('..');

main(process.argv.slice(2))
  .then(({stdout}) => console.log(stdout));
