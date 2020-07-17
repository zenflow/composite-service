import { CompositeServiceConfig } from './CompositeServiceConfig'
import { LogLevel, orderedLogLevels } from './Logger'
import { ServiceConfig } from './ServiceConfig'
import { ReadyContext } from './ReadyContext'
import { OnCrashContext } from './OnCrashContext'

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

type AssertFunction = (truthy: any, message: string) => void
type GetAssertFunction = (path: string) => AssertFunction

/**
 * Validates and normalizes `config` in one pass.
 *
 * Does a lot of validation since most script,
 * since most scripts to implement composite server will NOT use TypeScript
 *
 * @param errors - Array to be populated with validation errors
 * @param config
 */
export function validateAndNormalizeConfig(
  errors: string[],
  config: CompositeServiceConfig,
): NormalizedCompositeServiceConfig {
  return process(
    path => (truthy, message) => {
      if (!truthy) {
        errors.push(`config${path} ${message}`)
      }
    },
    config,
  )
}

function process(
  getAssert: GetAssertFunction,
  config: CompositeServiceConfig,
): NormalizedCompositeServiceConfig {
  const result = {
    logLevel: processLogLevel(
      path => getAssert(`.logLevel${path}`),
      config.logLevel,
    ),
    services: processServices(
      path => getAssert(`.services${path}`),
      config.services,
    ),
  }
  checkUnknownProperties(getAssert, config, result)
  return result
}

function processLogLevel(
  getAssert: GetAssertFunction,
  logLevel: CompositeServiceConfig['logLevel'] = 'info',
): NormalizedCompositeServiceConfig['logLevel'] {
  const levelsText = orderedLogLevels.map(s => `'${s}'`).join(', ')
  const isValid = orderedLogLevels.includes(logLevel)
  getAssert('')(isValid, `is not one of ${levelsText}`)
  return isValid ? logLevel : 'info'
}

function processServices(
  getAssert: GetAssertFunction,
  services: CompositeServiceConfig['services'],
): NormalizedCompositeServiceConfig['services'] {
  const isDefined = typeof services !== 'undefined'
  getAssert('')(isDefined, 'is not defined')
  if (!isDefined) {
    return {}
  }
  const isObject = typeof services === 'object' && services !== null
  getAssert('')(isObject, 'is not an object')
  if (!isObject) {
    return {}
  }
  let filtered = Object.entries(services).filter(([, value]) => value) as [
    string,
    ServiceConfig,
  ][]
  getAssert('')(filtered.length > 0, 'has no actual entries')
  for (const [id, service] of filtered) {
    getAssert(`.${id}`)(typeof service === 'object', 'is not an object')
  }
  const serviceIds = filtered.map(([id]) => id)
  const result = Object.fromEntries(
    filtered
      // filter non-objects so we don't try to walk them in checkServicesForCyclicDeps
      .filter(([, service]) => typeof service === 'object')
      .map(([id, service]) => [
        id,
        processService(path => getAssert(`.${id}${path}`), service, serviceIds),
      ]),
  )
  checkServicesForCyclicDeps(getAssert, result)
  return result
}

function processService(
  getAssert: GetAssertFunction,
  config: ServiceConfig,
  serviceIds: string[],
): NormalizedServiceConfig {
  const { cwd = '.' } = config
  getAssert('.cwd')(typeof cwd === 'string', 'is not a string')
  const { ready = () => Promise.resolve() } = config
  getAssert('.ready')(typeof ready === 'function', 'is not a function')
  const { onCrash = () => {} } = config
  getAssert('.onCrash')(typeof onCrash === 'function', 'is not a function')
  const { logTailLength = 0 } = config
  getAssert('.logTailLength')(
    typeof logTailLength === 'number',
    'is not a number',
  )
  const { minimumRestartDelay = 1000 } = config
  getAssert('.minimumRestartDelay')(
    typeof minimumRestartDelay === 'number',
    'is not a number',
  )
  const result = {
    dependencies: processDependencies(
      path => getAssert(`.dependencies${path}`),
      config.dependencies,
      serviceIds,
    ),
    cwd,
    command: processCommand(
      path => getAssert(`.command${path}`),
      config.command,
    ),
    env: processEnv(path => getAssert(`.env${path}`), config.env),
    ready,
    onCrash,
    logTailLength,
    minimumRestartDelay,
  }
  checkUnknownProperties(getAssert, config, result)
  return result
}

function processDependencies(
  getAssert: GetAssertFunction,
  dependencies: ServiceConfig['dependencies'] = [],
  serviceIds: string[],
): NormalizedServiceConfig['dependencies'] {
  const isArrayOfStrings =
    Array.isArray(dependencies) &&
    dependencies.every(dependency => typeof dependency === 'string')
  getAssert('')(isArrayOfStrings, 'is not an array of strings')
  if (!isArrayOfStrings) {
    return []
  }
  for (const dependency of dependencies) {
    getAssert('')(
      serviceIds.includes(dependency),
      `contains invalid service id '${dependency}'`,
    )
  }
  // filter invalid dependencies so we don't try to walk them in checkServicesForCyclicDeps
  return dependencies.filter(dependency => serviceIds.includes(dependency))
}

function processCommand(
  getAssert: GetAssertFunction,
  command: ServiceConfig['command'],
): NormalizedServiceConfig['command'] {
  const isDefined = typeof command !== 'undefined'
  getAssert('')(isDefined, 'is not defined')
  if (!isDefined) {
    return []
  }
  getAssert('')(
    typeof command === 'string' ||
      (Array.isArray(command) &&
        command.every(element => typeof element === 'string')),
    'is not a string or an array of strings',
  )
  const result =
    typeof command === 'string' ? command.split(/\s+/).filter(Boolean) : command
  getAssert('')(result.length > 0, 'is empty')
  return result
}

function processEnv(
  getAssert: GetAssertFunction,
  env: ServiceConfig['env'] = {},
): NormalizedServiceConfig['env'] {
  const isObject = typeof env === 'object' && env !== null
  getAssert('')(isObject, 'is not an object')
  if (!isObject) {
    return {}
  }
  for (const [key, value] of Object.entries(env)) {
    getAssert(`.${key}`)(
      ['string', 'number', 'undefined'].includes(typeof value),
      'is not a string, number, or undefined',
    )
  }
  return Object.fromEntries(
    Object.entries(env)
      .filter(([, value]) => typeof value !== 'undefined')
      .map(([key, value]) => [key, String(value)]),
  )
}

function checkServicesForCyclicDeps(
  getAssert: GetAssertFunction,
  services: {
    [id: string]: NormalizedServiceConfig
  },
): void {
  Object.keys(services).forEach(serviceId => checkForCyclicDeps(serviceId))
  function checkForCyclicDeps(serviceId: string, path: string[] = []) {
    const isLooped = path.includes(serviceId)
    if (isLooped) {
      getAssert(`.${serviceId}`)(
        false,
        `has cyclic dependency ${path
          .slice(path.indexOf(serviceId))
          .concat(serviceId)
          .join(' -> ')}`,
      )
    } else {
      for (const dep of services[serviceId].dependencies) {
        checkForCyclicDeps(dep, [...path, serviceId])
      }
    }
  }
}

function checkUnknownProperties(
  getAssert: GetAssertFunction,
  object: { [key: string]: any },
  model: { [key: string]: any },
) {
  const modelKeys = Object.keys(model)
  const unknownKeys = Object.keys(object).filter(
    key => !modelKeys.includes(key),
  )
  const error = getAssert('').bind(null, false)
  for (const key of unknownKeys) {
    error(`has unknown property '${key}'`)
  }
}
