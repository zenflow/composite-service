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

    if (process.platform === 'win32' && this.config.windowsCtrlCShutdown) {
      require('generate-ctrl-c-event') // make sure this module loads before we even start
    }

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

    process.on('SIGINT', () => this.die(130, "Received 'SIGINT' signal"))
    process.on('SIGTERM', () => this.die(143, "Received 'SIGTERM' signal"))
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true)
      process.stdin.on('data', buffer => {
        if (buffer.toString('utf8') === '\u0003') {
          this.die(130, 'Received ctrl+c')
        }
      })
    }

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

    this.logger.info('Starting up...')
    Promise.all(
      this.services.map(service => this.startService(service)),
    ).then(() => this.logger.info('Done starting up'))
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

  private async die(exitCode: number, message: string): Promise<never> {
    if (!this.stopping) {
      this.stopping = true
      const isSignalExit = exitCode > 128 // we have either a signal exit or an error exit
      this.logger[isSignalExit ? 'info' : 'error'](message)
      if (process.platform === 'win32' && this.config.windowsCtrlCShutdown) {
        await this.ctrlCShutdown()
      } else if (this.config.gracefulShutdown) {
        await this.gracefulShutdown()
      } else {
        await this.normalShutdown()
      }
      await Promise.resolve() // Wait one micro tick for output to flush
      process.exit(exitCode)
    }
    // simply return a promise that never resolves, since we can't do anything after exiting anyways
    return never()
  }
  private async normalShutdown() {
    this.logger.info('Shutting down...')
    await Promise.all(this.services.map(service => service.stop(false)))
    this.logger.info('Done shutting down')
  }
  private async gracefulShutdown() {
    const gracefulStopService = async (service: Service) => {
      await Promise.all(
        this.services
          .filter(({ config }) => config.dependencies.includes(service.id))
          .map(service => gracefulStopService(service)),
      )
      await service.stop(false)
    }
    this.logger.info('Shutting down gracefully...')
    await Promise.all(this.services.map(gracefulStopService))
    this.logger.info('Done shutting down gracefully')
  }
  private async ctrlCShutdown() {
    this.logger.info('Shutting down with ctrl+c...')
    Promise.resolve().then(() =>
      require('generate-ctrl-c-event').generateCtrlCAsync(),
    )
    await Promise.all(this.services.map(service => service.stop(true)))
    this.logger.info('Done shutting down with ctrl+c')
  }
}

function rightPad(string: string, length: number): string {
  // we assume length >= string.length
  return string + ' '.repeat(length - string.length)
}

function never(): Promise<never> {
  return new Promise<never>(() => {})
}
