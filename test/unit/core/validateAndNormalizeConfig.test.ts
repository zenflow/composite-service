import { CompositeServiceConfig } from '../../../src/core/CompositeServiceConfig'
import { validateAndNormalizeConfig } from '../../../src/core/validateAndNormalizeConfig'

const _v = (config: any): string | undefined => {
  let result: string | undefined
  try {
    validateAndNormalizeConfig(config as CompositeServiceConfig)
  } catch (e) {
    result = String(e)
  }
  return result
}
const minValid = { services: { foo: { command: 'foo' } } }
const _vs = (serviceConfig: any) => {
  return _v({
    services: { foo: { ...minValid.services.foo, ...serviceConfig } },
  })
}

describe('core/validateAndNormalizeConfig', () => {
  describe('CompositeServiceConfig', () => {
    it('essential', () => {
      expect(_v(undefined)).toMatchInlineSnapshot(
        `"ConfigValidationError: \`config\` is not an object"`,
      )
      expect(_v({})).toMatchInlineSnapshot(
        `"ConfigValidationError: \`config.services\` is missing"`,
      )
      expect(_v({ services: true })).toMatchInlineSnapshot(
        `"ConfigValidationError: \`config.services\` is not an object"`,
      )
      expect(_v({ services: {} })).toMatchInlineSnapshot(
        `"ConfigValidationError: \`config.services\` has no entries"`,
      )
      expect(_v({ services: { foo: false } })).toMatchInlineSnapshot(
        `"ConfigValidationError: \`config.services\` has no entries"`,
      )
      expect(_v({ services: { foo: true } })).toMatchInlineSnapshot(
        `"ConfigValidationError: \`config.services.foo\` is not an object"`,
      )
      expect(_v({ services: { foo: {} } })).toMatchInlineSnapshot(
        `"ConfigValidationError: \`config.services.foo.command\` is not defined"`,
      )
      expect(_v(minValid)).toBeUndefined()
    })
    it('service dependency tree', () => {
      expect(
        _v({
          services: {
            foo: { command: 'foo', dependencies: ['bar'] },
          },
        }),
      ).toMatchInlineSnapshot(
        `"ConfigValidationError: Service \\"foo\\" has dependency on unknown service \\"bar\\""`,
      )
      expect(
        _v({
          services: {
            foo: { command: 'foo', dependencies: ['bar'] },
            bar: { command: 'bar' },
          },
        }),
      ).toBeUndefined()
      expect(
        _v({
          services: {
            foo: { command: 'foo', dependencies: ['bar'] },
            bar: { command: 'bar', dependencies: ['foo'] },
          },
        }),
      ).toMatchInlineSnapshot(
        `"ConfigValidationError: Service \\"foo\\" has cyclic dependency foo -> bar -> foo"`,
      )
    })
    it('logLevel property', () => {
      expect(_v({ ...minValid, logLevel: 'debg' })).toMatchInlineSnapshot(
        `"ConfigValidationError: \`config.logLevel\` is none of \\"debug\\", \\"info\\", \\"error\\""`,
      )
      expect(_v({ ...minValid, logLevel: 'debug' })).toBeUndefined()
    })
    it('serviceDefaults property', () => {
      expect(_v({ serviceDefaults: { command: false }, services: { foo: {} } }))
        .toMatchInlineSnapshot(`
        "ConfigValidationError: \`config.serviceDefaults\` is not a ServiceConfig
            \`config.serviceDefaults.command\` is none of string, 1 more"
      `)
      expect(
        _v({ serviceDefaults: { command: '' }, services: { foo: {} } }),
      ).toMatchInlineSnapshot(
        `"ConfigValidationError: \`config.serviceDefaults.command\` has no binary part"`,
      )
      expect(
        _v({ serviceDefaults: { command: 'foo' }, services: { foo: {} } }),
      ).toBeUndefined()
    })
  })
  describe('ServiceConfig', () => {
    it('dependencies property', () => {
      expect(_vs({ dependencies: true })).toMatchInlineSnapshot(
        `"ConfigValidationError: \`config.services.foo.dependencies\` is not an array"`,
      )
      expect(_vs({ dependencies: [] })).toBeUndefined()
      expect(_vs({ dependencies: [false] })).toMatchInlineSnapshot(
        `"ConfigValidationError: \`config.services.foo.dependencies[0]\` is not a string"`,
      )
    })
    it('command property', async () => {
      expect(_vs({ command: true })).toMatchInlineSnapshot(
        `"ConfigValidationError: \`config.services.foo.command\` is none of string, 1 more"`,
      )
      expect(_vs({ command: '' })).toMatchInlineSnapshot(
        `"ConfigValidationError: \`config.services.foo.command\` has no binary part"`,
      )
      expect(_vs({ command: 'foo' })).toBeUndefined()
      expect(_vs({ command: [] })).toMatchInlineSnapshot(
        `"ConfigValidationError: \`config.services.foo.command\` has no binary part"`,
      )
      expect(_vs({ command: [''] })).toMatchInlineSnapshot(
        `"ConfigValidationError: \`config.services.foo.command\` has no binary part"`,
      )
      expect(_vs({ command: ['foo'] })).toBeUndefined()
      expect(_vs({ command: ['foo', false] })).toMatchInlineSnapshot(`
        "ConfigValidationError: \`config.services.foo.command\` is none of string, 1 more
            \`config.services.foo.command[1]\` is not a string"
      `)
      expect(_vs({ command: ['foo', ''] })).toBeUndefined()
    })
    it('other properties', () => {
      expect(_vs({ cwd: false })).toMatchInlineSnapshot(
        `"ConfigValidationError: \`config.services.foo.cwd\` is not a string"`,
      )
      expect(_vs({ cwd: 'foo' })).toBeUndefined()
      expect(_vs({ env: false })).toMatchInlineSnapshot(
        `"ConfigValidationError: \`config.services.foo.env\` is not an object"`,
      )
      expect(_vs({ env: {} })).toBeUndefined()
      expect(_vs({ ready: false })).toMatchInlineSnapshot(
        `"ConfigValidationError: \`config.services.foo.ready\` is not a function"`,
      )
      expect(
        _vs({
          ready: () => {},
        }),
      ).toBeUndefined()
      expect(_vs({ onCrash: false })).toMatchInlineSnapshot(
        `"ConfigValidationError: \`config.services.foo.onCrash\` is not a function"`,
      )
      expect(
        _vs({
          onCrash: () => {},
        }),
      ).toBeUndefined()
      expect(_vs({ logTailLength: false })).toMatchInlineSnapshot(
        `"ConfigValidationError: \`config.services.foo.logTailLength\` is not a number"`,
      )
      expect(_vs({ logTailLength: 1 })).toBeUndefined()
      expect(_vs({ minimumRestartDelay: false })).toMatchInlineSnapshot(
        `"ConfigValidationError: \`config.services.foo.minimumRestartDelay\` is not a number"`,
      )
      expect(_vs({ minimumRestartDelay: 1 })).toBeUndefined()
    })
  })
})
