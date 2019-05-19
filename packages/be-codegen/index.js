const minimist = require('minimist');
const {create} = require('@wix/proto-packages');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const {httpClient} = require('./lib/http-client-gen');

function main(args) {
  const terminator = args.indexOf('--');
  const extraArgs = terminator >= 0 ? args.slice(terminator + 1) : [];

  args = terminator >= 0 ? args.slice(0, terminator) : args;

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

function runHttpClientGen(rawArgs) {
  const {context, args} = createContext(rawArgs);

  return httpClient(context).generate(args._);
}

function createContext(args) {
  args = minimist(args);

  const workDir = args['work-dir'] || process.cwd();
  const sourceRoots = args['source-roots'] ? args['source-roots'].split(',') : ['proto', 'src/main/proto'];
  const extra = args['extra'];

  return {
    workDir,
    args,
    context: create({
      contextDir: workDir,
      sourceRoots,
      extraPackages: [extra]
    })
  };
}

module.exports = {
  main
};
