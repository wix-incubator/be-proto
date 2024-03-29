const minimist = require('minimist');
const {create} = require('@wix/proto-packages');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const {httpClientGen} = require('./lib/http-client-gen');
const {outputToFiles} = require('./lib/output-to-files');
const debug = require('debug')('be-codegen');
const path = require('path');

function main(args) {
  const terminator = args.indexOf('--');
  const extraArgs = terminator >= 0 ? args.slice(terminator + 1) : [];

  args = terminator >= 0 ? args.slice(0, terminator) : args;

  debug('Executing command', args[0]);

  if (args[0] === 'pbjs') {
    return runPbjs(args.slice(1), extraArgs);
  }

  if (args[0] === 'http-client') {
    return runHttpClientGen(args.slice(1), extraArgs);
  }
}

async function runPbjs(rawArgs, pbjsArgs) {
  const {context, workDir} = createContext(rawArgs);
  const files = await context.files();

  return exec(`pbjs ${pbjsArgs.join(' ')} ${files.join(' ')}`, {
    cwd: workDir
  });
}

async function runHttpClientGen(rawArgs) {
  const {context, args} = createContext(rawArgs);
  const lines = [];

  const cons = {
    log() {
      const args = Array.prototype.slice.call(arguments);

      lines.push(args.map(arg => arg.toString()).join(' '));
    }
  };

  debug('Will output to', args['output']);

  const output = outputToFiles(args['output'], cons);

  await httpClientGen(context).generate(args._, output);

  debug('Generation complete');

  try {
    await output.done();

    debug('Output processed');
  } catch(e) {
    cons.log('ERROR:', e);
  }

  return {
    stdout: lines.join('\r\n')
  };
}

function createContext(args) {
  args = minimist(args);

  const workDir = args['work-dir'] || process.cwd();
  const sourceRoots = args['source-roots'] ? args['source-roots'].split(',') : ['proto', 'src/main/proto'];
  const extra = args['extra'];

  const pathToHttpBindingProto = path.resolve(path.dirname(require.resolve('@wix/be-http-binding')), 'proto');
  const extraPackages = extra ? (Array.isArray(extra) ? extra : [extra]) : [];

  extraPackages.push(pathToHttpBindingProto);

  debug(`Using extra packages ${extraPackages.join(', ')}`);

  const options = {
    contextDir: workDir,
    sourceRoots,
    extraPackages
  };

  debug('Creating context', options);

  return {
    workDir,
    args,
    context: create(options)
  };
}

module.exports = {
  main
};
