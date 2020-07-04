import { CompositeServiceConfig } from './CompositeServiceConfig'
import { ComposedServiceConfig } from './ComposedServiceConfig'
import { ReadyConfigContext } from './ReadyConfigContext'
import { HandleCrashConfigContext } from './HandleCrashConfigContext'

export interface NormalizedCompositeServiceConfig {
  printConfig: boolean
  services: { [id: string]: NormalizedComposedServiceConfig }
}

export interface NormalizedComposedServiceConfig {
  dependencies: string[]
  command: string[]
  env: { [key: string]: string }
  ready: (ctx: ReadyConfigContext) => Promise<any>
  handleCrash: (ctx: HandleCrashConfigContext) => any
}

class ConfigValidationError extends Error {
  constructor(key: string, message: string) {
    super(`config.${key}: ${message}`)
  }
}
const assert = (truthy: any, key: string, message: string) => {
  if (!truthy) {
    throw new ConfigValidationError(key, message)
  }
}

export function validateAndNormalizeConfig(
  config: CompositeServiceConfig
): NormalizedCompositeServiceConfig {
  // Let's do a lot of validation, since most scripts to implement composite server will NOT use TypeScript
  const printConfig = Boolean(config.printConfig)
  const filteredServiceEntries = Object.entries(config.services).filter(
    ([, value]) => value
  ) as [string, ComposedServiceConfig][]
  const serviceIds = filteredServiceEntries.map(([id]) => id)
  assert(serviceIds.length > 0, 'services', 'No configured service')
  const services = Object.fromEntries(
    filteredServiceEntries.map(([id, config]) => {
      const _assert = (truthy: any, key: string, message: string) =>
        assert(truthy, `services.${id}.${key}`, message)
      const dependencies = config.dependencies || []
      _assert(Array.isArray(dependencies), 'dependencies', 'Not an array')
      dependencies.forEach(dependency => {
        _assert(
          serviceIds.includes(dependency),
          'dependencies',
          `Contains invalid service id '${dependency}'`
        )
      })
      let command =
        typeof config.command === 'string'
          ? config.command.split(/\s+/).filter(Boolean)
          : config.command
      _assert(Array.isArray(command), 'command', 'Not a string or an array')
      command = command.map(part => {
        _assert(
          ['string', 'number'].includes(typeof part),
          'command',
          `Contains an element that is not string or number`
        )
        return String(part)
      })
      const env = Object.fromEntries(
        Object.entries(config.env || {})
          .filter(([, value]) => typeof value !== 'undefined')
          .map(([key, value]) => {
            _assert(
              ['string', 'number'].includes(typeof value),
              `env.${key}`,
              'Not a string, a number, or undefined'
            )
            return [key, String(value)]
          })
      )
      const ready = config.ready || (() => Promise.resolve())
      _assert(typeof ready === 'function', 'ready', 'Not a function')
      const handleCrash = config.handleCrash || (() => {})
      _assert(
        typeof handleCrash === 'function',
        'handleCrash',
        'Not a function'
      )
      return [id, { dependencies, command, env, ready, handleCrash }]
    })
  )
  Object.keys(services).forEach(serviceId => checkForCyclicDeps(serviceId))
  function checkForCyclicDeps(serviceId: string, path: string[] = []) {
    assert(
      !path.includes(serviceId),
      'services',
      `Found cyclic dependency ${path
        .slice(path.indexOf(serviceId))
        .concat(serviceId)
        .join(' -> ')}`
    )
    for (const dep of services[serviceId].dependencies) {
      checkForCyclicDeps(dep, [...path, serviceId])
    }
  }
  return { printConfig, services }
}
