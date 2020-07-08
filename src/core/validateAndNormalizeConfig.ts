import { CompositeServiceConfig } from './CompositeServiceConfig'
import { ComposedServiceConfig } from './ComposedServiceConfig'
import { ReadyConfigContext } from './ReadyConfigContext'
import { OnCrashConfigContext } from './OnCrashConfigContext'

export interface NormalizedCompositeServiceConfig {
  printConfig: boolean
  services: { [id: string]: NormalizedComposedServiceConfig }
}

export interface NormalizedComposedServiceConfig {
  dependencies: string[]
  cwd: string
  command: string[]
  env: { [key: string]: string }
  ready: (ctx: ReadyConfigContext) => Promise<any>
  onCrash: (ctx: OnCrashConfigContext) => any
  logTailLength: number
  minimumRestartDelay: number
}

class ConfigValidationError extends Error {
  constructor(message: string) {
    super(`config.${message}`)
  }
}
const assert = (truthy: any, message: string) => {
  if (!truthy) {
    throw new ConfigValidationError(message)
  }
}

/**
 * Does a lot of validation since most script,
 * since most scripts to implement composite server will NOT use TypeScript
 * @param config
 */
export function validateAndNormalizeConfig(
  config: CompositeServiceConfig
): NormalizedCompositeServiceConfig {
  const printConfig = Boolean(config.printConfig)
  const filteredServiceEntries = Object.entries(config.services).filter(
    ([, value]) => value
  ) as [string, ComposedServiceConfig][]
  const serviceIds = filteredServiceEntries.map(([id]) => id)
  assert(serviceIds.length > 0, 'services: No configured service')
  const services = Object.fromEntries(
    filteredServiceEntries.map(([id, config]) => {
      const _assert = (truthy: any, message: string) =>
        assert(truthy, `services.${id}.${message}`)
      const { dependencies = [] } = config
      _assert(Array.isArray(dependencies), 'dependencies: Not an array')
      dependencies.forEach(dependency => {
        _assert(
          serviceIds.includes(dependency),
          `dependencies: Contains invalid service id '${dependency}'`
        )
      })
      let { cwd = '.' } = config
      _assert(typeof cwd === 'string', 'cwd: Not a string')
      let command =
        typeof config.command === 'string'
          ? config.command.split(/\s+/).filter(Boolean)
          : config.command
      _assert(Array.isArray(command), 'command: Not a string or an array')
      command = command.map(part => {
        _assert(
          ['string', 'number'].includes(typeof part),
          `command: Contains an element that is not string or number`
        )
        return String(part)
      })
      const env = Object.fromEntries(
        Object.entries(config.env || {})
          .filter(([, value]) => typeof value !== 'undefined')
          .map(([key, value]) => {
            _assert(
              ['string', 'number'].includes(typeof value),
              `env.${key}: Not a string, a number, or undefined`
            )
            return [key, String(value)]
          })
      )
      const { ready = () => Promise.resolve() } = config
      _assert(typeof ready === 'function', 'ready: Not a function')
      const { onCrash = () => {} } = config
      _assert(typeof onCrash === 'function', 'onCrash: Not a function')
      const { logTailLength = 0 } = config
      _assert(typeof logTailLength === 'number', 'logTailLength: Not a number')
      const { minimumRestartDelay = 1000 } = config
      _assert(
        typeof minimumRestartDelay === 'number',
        'minimumRestartDelay: Not a number'
      )
      return [
        id,
        {
          dependencies,
          cwd,
          command,
          env,
          ready,
          onCrash,
          logTailLength,
          minimumRestartDelay,
        },
      ]
    })
  )
  Object.keys(services).forEach(serviceId => checkForCyclicDeps(serviceId))
  function checkForCyclicDeps(serviceId: string, path: string[] = []) {
    assert(
      !path.includes(serviceId),
      `services: Found cyclic dependency ${path
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
