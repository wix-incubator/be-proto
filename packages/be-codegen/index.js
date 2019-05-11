const minimist = require('minimist');
const {create} = require('@wix/proto-packages');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

function main(args) {
  const terminator = args.indexOf('--');
  const extraArgs = terminator >= 0 ? args.slice(terminator + 1) : [];

  args = terminator >= 0 ? args.slice(0, terminator) : args;

  if (args[0] === 'pbjs') {
    return runPbjs(args.slice(1), extraArgs);
  }
}

async function runPbjs(args, pbjsArgs) {
  args = minimist(args);

  const typeNames = args._;
  const workDir = args['work-dir'] || process.cwd();
  const sourceRoots = args['source-roots'] || ['proto', 'src/main/proto'];

  const context = create({
    contextDir: workDir,
    sourceRoots
  });

  const files = await context.queryFilesFor(typeNames);

  return exec(`pbjs ${pbjsArgs.join(' ')} ${files.join(' ')}`, {
    cwd: workDir
  });
}

module.exports = {
  main
};
