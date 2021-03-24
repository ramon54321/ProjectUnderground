#!/usr/bin/env node

const { join } = require('path')
const { execSync } = require('child_process')
const homedir = require('os').homedir()
const chokidar = require('chokidar')

require('yargs/yargs')(process.argv.slice(2))
    .usage('Usage: $0 <command> [options]')
    .version('0.0.1')
    .command('sync', 'Sync local and remote projects', () => {}, sync)
    .option('project', {
      alias: 'p',
      nargs: 1,
      describe: 'Project name',
      demandOption: true
    })
    .help('h')
    .alias('h', 'help')
    .argv

function getInfo(args) {
  const projectName = args.project
  return {
    projectName: projectName,
    localProjectDirectory: join(homedir, 'Documents/PersonalProjects', projectName),
    remoteProjectDirectory: join('~/projects', projectName),
  }
}

// ---- Command Functions

function sync(args) {
  const info = getInfo(args)
  ensureProjectDirectories(info)
  startSyncWatcher(info)
}

// ---- Util Functions

function ensureProjectDirectories(info) {
  console.log(`Ensuring directories for: ${info.projectName}`)
  runLocalHome(`mkdir -p ${info.localProjectDirectory}`)
  runRemoteHome(`mkdir -p ${info.remoteProjectDirectory}`)
}

function startSyncWatcher(info) {
  console.log(`Watching directory for changes: ${info.localProjectDirectory}`)
  const watcher = chokidar.watch('.', { persistent: true, cwd: info.localProjectDirectory })
  const sync = (path) => {
    console.log(`Change: ${path}`)
    runLocalProject(info, `rsync -a --delete ${info.localProjectDirectory}/ master:${info.remoteProjectDirectory}`)
  }
  watcher
    .on('add', sync)
    .on('change', sync)
    .on('unlink', sync)
    .on('error', (err) => console.log(`Watcher Error: ${err}`))
}

// ---- Exec Functions

function runLocalHome(command) {
  return execSync(command, {
    cwd: homedir,
    shell: '/bin/zsh',
  }).toString()
}

function runLocalProject(info, command) {
  return execSync(`cd ${info.localProjectDirectory} && ` + command, {
    cwd: homedir,
    shell: '/bin/zsh',
  }).toString()
}

function runRemoteHome(command) {
  return execSync('ssh master "' + command + '"', {
    cwd: homedir, // Local CWD
    shell: '/bin/zsh', // Local Shell
  }).toString()
}

function runRemoteProject(info, command) {
  return execSync(`ssh master "cd ${info.remoteProjectDirectory} && ` + command + '"', {
    cwd: homedir, // Local CWD
    shell: '/bin/zsh', // Local Shell
  }).toString()
}
