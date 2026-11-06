import parseArgs from 'minimist'

import { log, fatal } from '../utils/logger.js'

const argv = parseArgs(process.argv.slice(2), {
  alias: {
    h: 'help',
    e: 'entry',
    c: 'cache',
    d: 'dist',
    q: 'qconf'
  },
  boolean: [ 'h', 'e', 'c', 'd', 'q' ],
  default: {
    e: false,
    c: false,
    d: false,
    q: false
  }
})

if (argv.help) {
  console.log(`
  Description
    Cleans all build artifacts
    (dev/build cache, /dist folder & entry points)

  Usage
    $ quasar clean

  Options
    --entry, -e    Cleans generated entry points only
    --cache, -c    Cleans dev/build cache only
    --dist, -d     Cleans /dist folder only
    --qconf, -q    Cleans temporary compiled quasar.config files
                      (used for issue investigation)
    --help, -h     Displays this message
  `)
  process.exit(0)
}

import fse from 'fs-extra'
import { getCtx } from '../utils/get-ctx.js'

const { appPaths } = getCtx()
const { pathContext } = appPaths

if (pathContext.isolated && argv.dist === true) {
  fatal('Isolated clean cannot remove the shared /dist folder. Clean the run-specific build output through its owner.')
}

console.log()

const cleanAll = (
  argv.entry !== true
  && argv.cache !== true
  && argv.dist !== true
  && argv.qconf !== true
)

if (cleanAll === true || argv.entry === true) {
  fse.removeSync(appPaths.pathContext.generatedRoot)
  log('Cleaned generated entry points')
}

if (cleanAll === true || argv.cache === true) {
  fse.removeSync(pathContext.isolated ? pathContext.cacheRoot : appPaths.cacheDir)
  log('Cleaned dev/build cache')
}

if (pathContext.isolated === false && (cleanAll === true || argv.dist === true)) {
  // we empty the dist folder
  // (will not work if build > distDir was changed outside of it)
  fse.emptyDirSync(appPaths.resolve.app('dist'))
  log('Cleaned /dist folder')
}

if (cleanAll === true || argv.qconf === true) {
  const { globSync } = await import('tinyglobby')
  const fileList = globSync([ 'quasar.config.*.temporary.compiled.*' ], {
    cwd: appPaths.pathContext.configTempDir,
    absolute: true
  })

  fileList.forEach(file => {
    fse.removeSync(file)
  })

  log(`Cleaned ${ fileList.length } temporary compiled quasar.config file${ fileList.length === 1 ? '' : 's' }`)
}

console.log()
