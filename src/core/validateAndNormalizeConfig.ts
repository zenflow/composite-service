import { getCheckers } from '@zen_flow/ts-interface-builder/macro'
import { CompositeServiceConfig } from './CompositeServiceConfig'
import { ServiceConfig } from './ServiceConfig'
import { LogLevel } from './Logger'
import { ReadyContext } from './ReadyContext'
import { OnCrashContext } from './OnCrashContext'
import { getErrorMessage } from './util/ts-interface-checker'

export interface NormalizedCompositeServiceConfig {
  logLevel: LogLevel
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
): [string] | [undefined, NormalizedCompositeServiceConfig] {
  const checker = getCheckers('./CompositeServiceConfig.ts', {
    ignoreIndexSignature: true,
  }).CompositeServiceConfig
  checker.setReportedPath('config')
  const error = checker.validate(config)
  if (error) {
    return [getErrorMessage(error)]
  }

  const { logLevel = 'info' } = config

  const truthyServiceEntries = Object.entries(config.services).filter(
    ([, value]) => value,
  ) as [string, ServiceConfig][]
  if (truthyServiceEntries.length === 0) {
    return ['`config.services` has no entries']
  }
  const services: { [id: string]: NormalizedServiceConfig } = {}
  for (const [id, config] of truthyServiceEntries) {
    if (config) {
      const [error, normalized] = validateServiceConfig(id, config)
      if (error) {
        return [error]
      }
      services[id] = normalized!
    }
  }
  const cyclicDepError = checkServicesForCyclicDeps(services)
  if (cyclicDepError) {
    return [cyclicDepError]
  }

  return [undefined, { logLevel, services }]
}

function validateServiceConfig(
  id: string,
  config: ServiceConfig,
): [string] | [undefined, NormalizedServiceConfig] {
  const checker = getCheckers('./ServiceConfig.ts', {
    ignoreIndexSignature: true,
  }).ServiceConfig
  checker.setReportedPath(`config.services.${id}`)
  const error = checker.validate(config)
  if (error) {
    return [getErrorMessage(error)]
  }

  if (
    typeof config.command !== 'undefined' &&
    (Array.isArray(config.command)
      ? !config.command.length || !config.command[0].trim()
      : !config.command.trim())
  ) {
    return [`\`config.services.${id}.command\` is empty`]
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
  const output: NormalizedServiceConfig = {
    dependencies,
    cwd,
    command,
    env,
    ready,
    onCrash,
    logTailLength,
    minimumRestartDelay,
  }

  return [undefined, output]
}

function checkServicesForCyclicDeps(services: {
  [id: string]: NormalizedServiceConfig
}): string | null {
  for (const serviceId of Object.keys(services)) {
    const error = checkForCyclicDeps(serviceId, [])
    if (error) return error
  }
  return null
  function checkForCyclicDeps(
    serviceId: string,
    path: string[],
  ): string | null {
    const isLooped = path.includes(serviceId)
    if (isLooped) {
      return `Service "${serviceId}" has cyclic dependency ${path
        .slice(path.indexOf(serviceId))
        .concat(serviceId)
        .join(' -> ')}`
    }
    for (const dep of services[serviceId].dependencies) {
      const error = checkForCyclicDeps(dep, [...path, serviceId])
      if (error) return error
    }
    return null
  }
}
