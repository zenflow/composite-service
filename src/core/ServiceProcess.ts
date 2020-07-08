import { PassThrough } from 'stream'
import {
  ChildProcessWithoutNullStreams,
  spawn,
  SpawnOptionsWithoutStdio,
} from 'child_process'
import { once } from 'events'
import { normalize } from 'path'
import mergeStream from 'merge-stream'
import splitStream from 'split'
import npmRunPath from 'npm-run-path'
import getPathKey from 'path-key'
import which from 'which'
import { NormalizedComposedServiceConfig } from './validateAndNormalizeConfig'

const split = () => splitStream((line: string) => `${line}\n`)
const isWindows = process.platform === 'win32'

export class ServiceProcess {
  public readonly output = new PassThrough({ objectMode: true })
  public readonly started: Promise<void>
  public isEnded = false
  public logTail: string[] = []
  private readonly process: ChildProcessWithoutNullStreams
  private readonly ended: Promise<void>
  private wasEndCalled = false
  constructor(config: NormalizedComposedServiceConfig, onCrash: () => void) {
    this.process = spawnProcess(config)
    const childOutput = mergeStream(
      this.process.stdout.setEncoding('utf8').pipe(split()),
      this.process.stderr.setEncoding('utf8').pipe(split())
    )
    childOutput.pipe(this.output)
    if (config.logTailLength > 0) {
      this.output.on('data', line => {
        this.logTail.push(line)
        if (this.logTail.length > config.logTailLength) {
          this.logTail.shift()
        }
      })
    }
    const error = new Promise(resolve => this.process.on('error', resolve))
    this.started = Promise.race([
      error,
      new Promise(resolve => setTimeout(resolve, 100)),
    ]).then(error => {
      if (!error) {
        return
      }
      childOutput.unpipe(this.output)
      this.output.end()
      return Promise.reject(error)
    })
    const didStart = this.started.then(
      () => true,
      () => false
    )
    this.ended = Promise.race([error, once(childOutput, 'end')]).then(() => {
      this.isEnded = true
      if (!this.wasEndCalled) {
        didStart.then(didStart => {
          if (didStart) {
            onCrash()
          }
        })
      }
    })
  }
  end() {
    if (!this.wasEndCalled) {
      this.wasEndCalled = true
      if (!this.isEnded) {
        this.process.kill('SIGINT')
      }
    }
    return this.ended
  }
}

function spawnProcess({ command, env }: NormalizedComposedServiceConfig) {
  let [cmd, ...args] = command
  const options: SpawnOptionsWithoutStdio = {
    env: {
      ...env,
      // Use uppercase PATH key regardless of OS or original key
      PATH: npmRunPath({ path: env[getPathKey({ env })] || '' }),
    },
  }
  if (isWindows) {
    options.env!.PATHEXT =
      env.PATHEXT || '.COM;.EXE;.BAT;.CMD;.VBS;.VBE;.JS;.JSE;.WSF;.WSH'

    /*
      Work around issue (same issue):
        - https://github.com/nodejs/node-v0.x-archive/issues/2318
        - https://github.com/nodejs/node/issues/6671

      Without resorting to wrapping command in shell (like npm package `cross-spawn` does)
      because [spawning a shell is expensive](https://github.com/nodejs/node/issues/6671#issuecomment-219210529)
      and more importantly, that approach introduces *more* window-linux disparities.

      Instead just replace `cmd` with a fully-qualified version.
     */
    cmd = normalize(
      which.sync(cmd, {
        nothrow: true,
        path: options.env!.PATH,
        pathExt: options.env!.PATHEXT,
      }) || cmd
    )
  }
  return spawn(cmd, args, options)
}
