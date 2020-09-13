import { Service } from './Service'
import serializeJavascript from 'serialize-javascript'
import mergeStream from 'merge-stream'
import {
  NormalizedCompositeServiceConfig,
  validateAndNormalizeConfig,
} from './validateAndNormalizeConfig'
import { CompositeServiceConfig } from './CompositeServiceConfig'
import { Logger } from './Logger'
import { mapStreamLines } from './util/stream'

export class CompositeService {
  private config: NormalizedCompositeServiceConfig
  private services: Service[]
  private serviceMap: Map<string, Service>
  private stopping = false
  private logger: Logger

  constructor(config: CompositeServiceConfig) {
    this.config = validateAndNormalizeConfig(config)

    const outputStream = mergeStream()
    outputStream.pipe(process.stdout)

    this.logger = new Logger(this.config.logLevel)
    outputStream.add(this.logger.output)
    this.logger.debug(
      'Config: ' +
        serializeJavascript(config, {
          space: 2,
          unsafe: true,
        }),
    )

    process.on('SIGINT', () =>
      this.die(130, "Received shutdown signal 'SIGINT'"),
    )
    process.on('SIGTERM', () =>
      this.die(143, "Received shutdown signal 'SIGTERM'"),
    )

    this.services = Object.entries(this.config.services).map(
      ([id, config]) =>
        new Service(id, config, this.logger, message =>
          this.handleError(`Error in '${id}': ${message}`),
        ),
    )
    this.serviceMap = new Map(
      this.services.map(service => [service.id, service]),
    )

    const maxLabelLength = Math.max(
      ...Object.keys(this.config.services).map(({ length }) => length),
    )
    outputStream.add(
      this.services.map(({ output, id }) =>
        output.pipe(
          mapStreamLines(
            line => `${`${rightPad(id, maxLabelLength)} | `}${line}`,
          ),
        ),
      ),
    )

    this.logger.info('Starting composite service...')
    Promise.all(
      this.services.map(service => this.startService(service)),
    ).then(() => this.logger.info('Started composite service'))
  }

  private async startService(service: Service) {
    const dependencies = service.config.dependencies.map(
      id => this.serviceMap.get(id)!,
    )
    await Promise.all(dependencies.map(service => this.startService(service)))
    if (this.stopping) {
      await never()
    }
    await service.start()
  }

  private handleError(message: string) {
    return this.die(1, message)
  }

  private die(exitCode: number, message: string): Promise<never> {
    if (!this.stopping) {
      this.stopping = true
      const isSignalExit = exitCode > 128 // we have either a signal exit or an error exit
      this.logger[isSignalExit ? 'info' : 'error'](message)
      this.logger.info('Stopping composite service...')
      Promise.all(this.services.map(service => this.stopService(service)))
        .then(() => this.logger.info('Stopped composite service'))
        // Wait one micro tick for output to flush
        .then(() => process.exit(1))
    }
    // simply return a promise that never resolves, since we can't do anything after exiting anyways
    return never()
  }

  private async stopService(service: Service) {
    if (this.config.gracefulShutdown) {
      await Promise.all(
        this.services
          .filter(({ config }) => config.dependencies.includes(service.id))
          .map(service => this.stopService(service)),
      )
    }
    await service.stop()
  }
}

function rightPad(string: string, length: number): string {
  // we assume length >= string.length
  return string + ' '.repeat(length - string.length)
}

function never(): Promise<never> {
  return new Promise<never>(() => {})
}
