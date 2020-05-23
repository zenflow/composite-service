import { assert } from './assert'
import {
  ComposedServiceConfig,
  CompositeServiceConfig,
  NormalizedCompositeServiceConfig,
} from './config-types'

export function normalizeCompositeServiceConfig(
  config: CompositeServiceConfig
): NormalizedCompositeServiceConfig {
  // Let's do a lot of validation, since most scripts to implement composite server will NOT use TypeScript
  const _assert = (value: any, message: string) =>
    assert(value, `Invalid Config: ${message}`)
  const printConfig = Boolean(config.printConfig)
  const filteredServiceEntries = Object.entries(config.services).filter(
    ([, value]) => value
  ) as [string, ComposedServiceConfig][]
  const serviceIds = filteredServiceEntries.map(([id]) => id)
  const services = Object.fromEntries(
    filteredServiceEntries.map(([id, config]) => {
      const __assert = (value: any, message: string) =>
        _assert(value, `Service '${id}': ${message}`)
      const dependencies = config.dependencies || []
      __assert(Array.isArray(dependencies), `\`dependencies\` is not an array`)
      dependencies.forEach(dependency => {
        __assert(
          serviceIds.includes(dependency),
          `Dependency on nonexistent service '${dependency}'`
        )
      })
      let command =
        typeof config.command === 'string'
          ? config.command.split(/\s+/).filter(Boolean)
          : config.command
      __assert(
        Array.isArray(command),
        `\`command\` is not a string or an array`
      )
      command = command.map(part => {
        __assert(
          ['string', 'number'].includes(typeof part),
          `Command contains an element that is not string or number`
        )
        return String(part)
      })
      const env = Object.fromEntries(
        Object.entries(config.env || {})
          .filter(([, value]) => typeof value !== 'undefined')
          .map(([key, value]) => {
            __assert(
              ['string', 'number'].includes(typeof value),
              `Environment variable '${key}' is not string, number, or undefined`
            )
            return [key, String(value)]
          })
      )
      const ready = config.ready
      __assert(typeof ready === 'function', `\`ready\` is not a function`)
      return [id, { dependencies, command, env, ready }]
    })
  )
  Object.keys(services).forEach(serviceId => checkForCyclicDeps(serviceId))
  function checkForCyclicDeps(serviceId: string, path: string[] = []) {
    _assert(
      !path.includes(serviceId),
      `Found cyclic dependency ${path
        .slice(path.indexOf(serviceId))
        .concat(serviceId)
        .join(' -> ')}`
    )
    for (const dep of services[serviceId].dependencies) {
      checkForCyclicDeps(dep, [...path, serviceId])
    }
  }
  _assert(Object.keys(services).length > 0, 'No configured service')
  return { printConfig, services }
}
