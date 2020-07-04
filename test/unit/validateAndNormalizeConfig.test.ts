import { validateAndNormalizeConfig } from '../../src/core/validateAndNormalizeConfig'

describe('validateAndNormalizeConfig', () => {
  it('throws if service has dependency on nonexistent service', () => {
    expect(() =>
      validateAndNormalizeConfig({
        services: {
          a: { command: '' },
          b: { command: '', dependencies: ['A'] },
        },
      })
    ).toThrow("config.services.b.dependencies: Contains invalid service id 'A'")
  })
  it('throws if cyclic dependency is found', () => {
    expect(() =>
      validateAndNormalizeConfig({
        services: {
          a: { command: '', dependencies: ['b'] },
          b: { command: '', dependencies: ['c'] },
          c: { command: '', dependencies: ['a'] },
        },
      })
    ).toThrow('config.services: Found cyclic dependency a -> b -> c -> a')
  })
})
