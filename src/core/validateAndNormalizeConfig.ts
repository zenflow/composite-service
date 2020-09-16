import { getCheckers } from '@zen_flow/ts-interface-builder/macro'
import { Checker, IErrorDetail } from 'ts-interface-checker'
import { CompositeServiceConfig } from './CompositeServiceConfig'
import { ServiceConfig } from './ServiceConfig'
import { LogLevel } from './Logger'
import { ReadyContext } from './ReadyContext'
import { OnCrashContext } from './OnCrashContext'

export interface NormalizedCompositeServiceConfig {
  logLevel: LogLevel
  gracefulShutdown: boolean
  windowsCtrlCShutdown: boolean
  services: { [id: string]: NormalizedServiceConfig }
}

export interface NormalizedServiceConfig {
  dependencies: string[]
  cwd: string
  command: string[]
  env: { [key: string]: string }
  ready: (ctx: ReadyContext) => Promise<any>
  onCrash: (ctx: OnCrashContext) => any
  logTailLength: number
  minimumRestartDelay: number
}

export function validateAndNormalizeConfig(
  config: CompositeServiceConfig,
): NormalizedCompositeServiceConfig {
  const checker = getCheckers('./CompositeServiceConfig.ts', {
    ignoreIndexSignature: true,
  }).CompositeServiceConfig
  validateType(checker, 'config', config)

  const { logLevel = 'info' } = config
  const { gracefulShutdown = false } = config
  const { windowsCtrlCShutdown = false } = config

  const truthyServiceEntries = Object.entries(config.services).filter(
    ([, value]) => value,
  ) as [string, ServiceConfig][]
  if (truthyServiceEntries.length === 0) {
    throw new ConfigValidationError('`config.services` has no entries')
  }
  const services: { [id: string]: NormalizedServiceConfig } = {}
  for (const [id, config] of truthyServiceEntries) {
    services[id] = validateServiceConfig(id, config)
  }
  validateDependencyTree(services)

  return {
    logLevel,
    gracefulShutdown,
    windowsCtrlCShutdown,
    services,
  }
}

function validateServiceConfig(
  id: string,
  config: ServiceConfig,
): NormalizedServiceConfig {
  const checker = getCheckers('./ServiceConfig.ts', {
    ignoreIndexSignature: true,
  }).ServiceConfig
  validateType(checker, `config.services.${id}`, config)

  if (
    typeof config.command !== 'undefined' &&
    (Array.isArray(config.command)
      ? !config.command.length || !config.command[0].trim()
      : !config.command.trim())
  ) {
    throw new ConfigValidationError(
      `\`config.services.${id}.command\` is empty`,
    )
  }

  // normalize
  const { dependencies = [] } = config
  const { cwd = '.' } = config
  const command =
    typeof config.command === 'string'
      ? config.command.split(/\s+/).filter(Boolean)
      : config.command
  const env = Object.fromEntries(
    Object.entries(config.env || {})
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, String(value)]),
  )
  const { ready = () => Promise.resolve() } = config
  const { onCrash = () => {} } = config
  const { logTailLength = 0 } = config
  const { minimumRestartDelay = 1000 } = config
  return {
    dependencies,
    cwd,
    command,
    env,
    ready,
    onCrash,
    logTailLength,
    minimumRestartDelay,
  }
}

function validateDependencyTree(services: {
  [id: string]: NormalizedServiceConfig
}): void {
  const serviceIds = Object.keys(services)
  for (const [serviceId, { dependencies }] of Object.entries(services)) {
    for (const dependency of dependencies) {
      if (!serviceIds.includes(dependency)) {
        throw new ConfigValidationError(
          `Service "${serviceId}" has dependency on unknown service "${dependency}"`,
        )
      }
    }
  }

  for (const serviceId of serviceIds) {
    validateNoCyclicDeps(serviceId, [])
  }

  function validateNoCyclicDeps(serviceId: string, path: string[]) {
    const isLooped = path.includes(serviceId)
    if (isLooped) {
      throw new ConfigValidationError(
        `Service "${serviceId}" has cyclic dependency ${path
          .slice(path.indexOf(serviceId))
          .concat(serviceId)
          .join(' -> ')}`,
      )
    }
    for (const dep of services[serviceId].dependencies) {
      validateNoCyclicDeps(dep, [...path, serviceId])
    }
    return null
  }
}

export class ConfigValidationError extends Error {
  constructor(message: string) {
    super(message)
    Object.setPrototypeOf(this, ConfigValidationError.prototype)
  }
}

ConfigValidationError.prototype.name = ConfigValidationError.name

function validateType(checker: Checker, reportedPath: string, value: any) {
  checker.setReportedPath(reportedPath)
  const error = checker.validate(value)
  if (error) {
    throw new ConfigValidationError(getErrorMessage(error))
  }
}

function getErrorMessage(error: IErrorDetail): string {
  return getErrorMessageLines(error).join('\n')
}

function getErrorMessageLines(error: IErrorDetail): string[] {
  let result = [`\`${error.path}\` ${error.message}`]
  if (error.nested) {
    for (const nested of error.nested) {
      result = result.concat(getErrorMessageLines(nested).map(s => `    ${s}`))
    }
  }
  return result
}
