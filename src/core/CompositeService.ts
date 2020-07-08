import { Service } from './Service'
import serializeJavascript from 'serialize-javascript'
import {
  NormalizedCompositeServiceConfig,
  validateAndNormalizeConfig,
} from './validateAndNormalizeConfig'
import mergeStream from 'merge-stream'
import { Duplex } from 'stream'
import mapStreamAsync from 'map-stream'
import { CompositeServiceConfig } from './CompositeServiceConfig'

export class CompositeService {
  private config: NormalizedCompositeServiceConfig
  private services: Service[]
  private serviceMap: Map<string, Service>
  private stopping = false

  constructor(config: CompositeServiceConfig) {
    if (config.printConfig) {
      console.log(
        'config =',
        serializeJavascript(config, { space: 2, unsafe: true })
      )
    }
    try {
      // TODO: return *array* of errors from validateAndNormalizeConfig
      this.config = validateAndNormalizeConfig(config)
    } catch (error) {
      console.error(error)
      process.exit(1)
    }

    for (const signal of ['SIGINT', 'SIGTERM']) {
      process.on(signal, () => {
        this.die(`Received shutdown signal '${signal}'`)
      })
    }

    this.services = Object.entries(this.config.services).map(
      ([id, config]) => new Service(id, config, this.die.bind(this))
    )
    this.serviceMap = new Map(
      this.services.map(service => [service.id, service])
    )

    const maxLabelLength = Math.max(
      ...Object.keys(this.config.services).map(({ length }) => length)
    )
    mergeStream(
      this.services.map(service =>
        service.output.pipe(
          mapStream(line => `${rightPad(service.id, maxLabelLength)} | ${line}`)
        )
      )
    ).pipe(process.stdout)

    console.log('Starting composite service...')
    Promise.all(
      this.services.map(service => this.startService(service))
    ).then(() => console.log('Started composite service'))
  }

  private async startService(service: Service) {
    const dependencies = service.config.dependencies.map(
      id => this.serviceMap.get(id)!
    )
    await Promise.all(dependencies.map(service => this.startService(service)))
    if (this.stopping) {
      await never()
    }
    await service.start()
  }

  private die(message: string): Promise<never> {
    if (!this.stopping) {
      this.stopping = true
      console.log(message)
      console.log('Stopping composite service...')
      Promise.all(this.services.map(service => this.stopService(service)))
        .then(() => console.log('Stopped composite service'))
        // Wait one micro tick for output to flush
        .then(() => process.exit(1))
    }
    // simply return a promise that never resolves, since we can't do anything after exiting anyways
    return never()
  }

  private async stopService(service: Service) {
    const dependents = this.services.filter(({ config }) =>
      config.dependencies.includes(service.id)
    )
    await Promise.all(dependents.map(service => this.stopService(service)))
    await service.stop()
  }
}

function mapStream(mapper: (arg0: string) => string): Duplex {
  return mapStreamAsync((string: string, cb: Function) =>
    cb(null, mapper(string))
  )
}

function rightPad(string: string, length: number): string {
  // we assume length >= string.length
  return string + ' '.repeat(length - string.length)
}

function never(): Promise<never> {
  return new Promise<never>(() => {})
}
