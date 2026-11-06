import { lstatSync } from 'node:fs'
import { basename, dirname, isAbsolute, join, normalize, relative, sep } from 'node:path'

const pathEnvNames = Object.freeze({
  generatedRoot: 'ZOVA_QUASAR_ROOT',
  cacheRoot: 'ZOVA_QUASAR_CACHE',
  configTempDir: 'ZOVA_QUASAR_CONFIG_DIR'
})

function readConfiguredPath (envName, value) {
  if (value === void 0) return void 0

  if (
    typeof value !== 'string'
    || value.length === 0
    || value.trim() !== value
    || value.includes('\0')
    || isAbsolute(value) === false
  ) {
    throw new Error(`Invalid ${ envName }: expected a non-empty absolute path.`)
  }

  return normalize(value)
}

function isDescendant (parent, child) {
  const rel = relative(parent, child)
  return rel.length !== 0 && rel !== '..' && rel.startsWith(`..${ sep }`) === false && isAbsolute(rel) === false
}

function validateDirectory (appDir, directory, envName) {
  let current = appDir
  for (const part of relative(appDir, directory).split(sep)) {
    current = join(current, part)
    const stats = lstatSync(current, { throwIfNoEntry: false })
    if (stats === void 0) break
    if (stats.isSymbolicLink() || stats.isDirectory() === false) {
      throw new Error(`Invalid ${ envName }: generated paths must use directories without symlinks.`)
    }
  }
}

/**
 * Capture the generated paths before loading user config or app extensions.
 *
 * Isolation requires all three absolute paths. The generated root must be a
 * dedicated .quasar-<run> directory immediately under the real appDir, with its cache
 * and config temp directories below it. Keeping the same dependency ancestry
 * preserves package resolution in generated code; restricting cleanup to this
 * subtree avoids treating arbitrary source or external directories as artifacts.
 * The caller owns allocating a unique root and keeping it stable for the run.
 *
 * @param {string} appDir
 */
export function getPathContext (appDir) {
  const configured = Object.fromEntries(
    Object.entries(pathEnvNames).map(([ key, envName ]) => [
      key,
      readConfiguredPath(envName, process.env[ envName ])
    ])
  )
  const isolated = Object.values(configured).some(value => value !== void 0)

  if (isolated) {
    if (Object.values(configured).some(value => value === void 0)) {
      throw new Error(`Directory isolation requires ${ Object.values(pathEnvNames).join(', ') } together.`)
    }

    const { generatedRoot } = configured
    if (
      dirname(generatedRoot) !== appDir
      || /^\.quasar-[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(basename(generatedRoot)) === false
    ) {
      throw new Error('Invalid ZOVA_QUASAR_ROOT: expected a dedicated .quasar-<run> directory directly under appDir.')
    }

    for (const key of [ 'cacheRoot', 'configTempDir' ]) {
      if (isDescendant(generatedRoot, configured[ key ]) === false) {
        throw new Error(`Invalid ${ pathEnvNames[ key ] }: expected a directory below ZOVA_QUASAR_ROOT.`)
      }
    }

    for (const [ key, directory ] of Object.entries(configured)) {
      validateDirectory(appDir, directory, pathEnvNames[ key ])
    }
  }

  return Object.freeze({
    isolated,
    generatedRoot: configured.generatedRoot || join(appDir, '.quasar'),
    cacheRoot: configured.cacheRoot || join(appDir, 'node_modules/.q-cache'),
    configTempDir: configured.configTempDir || appDir
  })
}

export { pathEnvNames }
