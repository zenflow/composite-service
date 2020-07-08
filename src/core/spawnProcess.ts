import { spawn } from 'child_process'
import { resolve, normalize } from 'path'
import npmRunPath from 'npm-run-path'
import getPathKey from 'path-key'
import which from 'which'
import { NormalizedComposedServiceConfig } from './validateAndNormalizeConfig'

// https://github.com/npm/node-which/blob/6a822d836de79f92fb3170f685a6e283fbfeff87/which.js#L1-L3
const isWindows =
  process.platform === 'win32' ||
  process.env.OSTYPE === 'cygwin' ||
  process.env.OSTYPE === 'msys'

export function spawnProcess(config: NormalizedComposedServiceConfig) {
  const cwd = resolve(config.cwd)
  let [binary, ...args] = config.command
  let env = { ...config.env }

  // Use uppercase PATH key regardless of OS or original key
  env.PATH = filterBlankParts(
    npmRunPath({
      cwd,
      path: config.env[getPathKey({ env: config.env })] || '',
    })
  )

  if (isWindows) {
    env.PATHEXT =
      config.env.PATHEXT || '.COM;.EXE;.BAT;.CMD;.VBS;.VBE;.JS;.JSE;.WSF;.WSH'

    /*
      Work around issue (same issue):
        - https://github.com/nodejs/node-v0.x-archive/issues/2318
        - https://github.com/nodejs/node/issues/6671

      Without resorting to wrapping command in shell (like npm package `cross-spawn` does)
      because [spawning a shell is expensive](https://github.com/nodejs/node/issues/6671#issuecomment-219210529)
      and more importantly, that approach introduces *more* window-linux disparities.

      Instead just replace `binary` with a fully-qualified version.
     */
    binary = normalize(myWhich(cwd, binary, env.PATH, env.PATHEXT) || binary)
  }

  return spawn(binary, args, { cwd, env })
}

function filterBlankParts(string: string) {
  const colon = isWindows ? ';' : ':'
  return string
    .split(colon)
    .filter(Boolean)
    .join(colon)
}

// Version of `which.sync` that adds a `cwd` parameter & doesn't throw
function myWhich(cwd: string, binary: string, path: string, pathExt: string) {
  const originalCwd = process.cwd()
  if (cwd !== originalCwd) {
    process.chdir(cwd)
  }
  const result = which.sync(binary, { nothrow: true, path, pathExt })
  if (cwd !== originalCwd) {
    process.chdir(originalCwd)
  }
  return result
}
