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
    ).toThrow(
      "composite-service: Invalid Config: Service 'b': Dependency on nonexistent service 'A'"
    )
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
    ).toThrow(
      'composite-service: Invalid Config: Found cyclic dependency a -> b -> c -> a'
    )
  })
})
