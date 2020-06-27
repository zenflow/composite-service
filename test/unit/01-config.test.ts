import { validateAndNormalizeConfig } from '../../src/core/validateAndNormalizeConfig'

describe('normalizeCompositeServiceConfig', () => {
  it('throws if cyclic dependency is defined', () => {
    const dummyService = { command: '', ready: async () => {} }
    expect(() =>
      validateAndNormalizeConfig({
        services: {
          a: { ...dummyService, dependencies: ['b'] },
          b: { ...dummyService, dependencies: ['c'] },
          c: { ...dummyService, dependencies: ['a'] },
        },
      })
    ).toThrow(
      'composite-service: Invalid Config: Found cyclic dependency a -> b -> c -> a'
    )
  })
})
