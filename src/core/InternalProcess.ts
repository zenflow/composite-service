import { PassThrough } from 'stream'
import { ChildProcessWithoutNullStreams, spawn } from 'child_process'
import { once } from 'events'
import mergeStream from 'merge-stream'
import splitStream from 'split'

const split = () => splitStream((line: string) => `${line}\n`)

export class InternalProcess {
  readonly output = new PassThrough({ objectMode: true })
  readonly started: Promise<void>
  readonly ended: Promise<void>
  isEnded = false
  private readonly child: ChildProcessWithoutNullStreams
  constructor(command: string[], env: { [key: string]: string }) {
    const { PATH } = process.env
    this.child = spawn(command[0], command.slice(1), {
      env: { PATH, ...env },
    })
    const childOutput = mergeStream(
      this.child.stdout.setEncoding('utf8').pipe(split()),
      this.child.stderr.setEncoding('utf8').pipe(split())
    )
    childOutput.pipe(this.output)
    const error = new Promise(resolve => this.child.on('error', resolve))
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
    this.ended = Promise.race([error, once(childOutput, 'end')]).then(() => {
      this.isEnded = true
    })
  }
  end() {
    this.child.kill('SIGINT')
    return this.ended
  }
}
