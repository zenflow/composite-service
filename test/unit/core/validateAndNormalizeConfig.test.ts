import { CompositeServiceConfig } from '../../../src/core/CompositeServiceConfig'
import { validateAndNormalizeConfig } from '../../../src/core/validateAndNormalizeConfig'

const _v = (config: any) => {
  return validateAndNormalizeConfig(config as CompositeServiceConfig)[0]
}
const minValid = { services: { foo: { command: 'foo' } } }
const _vs = (serviceConfig: any) => {
  return _v({
    services: { foo: { ...minValid.services.foo, ...serviceConfig } },
  })
}

describe('core/config/validate', () => {
  describe('CompositeServiceConfig', () => {
    it('services property', () => {
      expect(_v(undefined)).toMatchInlineSnapshot(
        `"\`config\` is not an object"`,
      )
      expect(_v({})).toMatchInlineSnapshot(`"\`config.services\` is missing"`)
      expect(_v({ services: true })).toMatchInlineSnapshot(
        `"\`config.services\` is not an object"`,
      )
      expect(_v({ services: {} })).toMatchInlineSnapshot(
        `"\`config.services\` has no entries"`,
      )
      expect(_v({ services: { foo: false } })).toMatchInlineSnapshot(
        `"\`config.services\` has no entries"`,
      )
      expect(_v({ services: { foo: true } })).toMatchInlineSnapshot(
        `"\`config.services.foo\` is not an object"`,
      )
      expect(_v({ services: { foo: {} } })).toMatchInlineSnapshot(
        `"\`config.services.foo.command\` is missing"`,
      )
      expect(_v(minValid)).toBeUndefined()
      expect(
        _v({
          services: {
            a: { command: 'foo', dependencies: ['b'] },
            b: { command: 'foo', dependencies: ['a'] },
          },
        }),
      ).toMatchInlineSnapshot(
        `"Service \\"a\\" has cyclic dependency a -> b -> a"`,
      )
    })
    it('logLevel property', () => {
      expect(_v({ ...minValid, logLevel: 'debg' })).toMatchInlineSnapshot(
        `"\`config.logLevel\` is none of \\"debug\\", \\"info\\", \\"error\\""`,
      )
      expect(_v({ ...minValid, logLevel: 'debug' })).toBeUndefined()
    })
  })
  describe('ServiceConfig', () => {
    it('dependencies property', () => {
      expect(_vs({ dependencies: true })).toMatchInlineSnapshot(
        `"\`config.services.foo.dependencies\` is not an array"`,
      )
      expect(_vs({ dependencies: [] })).toBeUndefined()
      expect(_vs({ dependencies: [false] })).toMatchInlineSnapshot(
        `"\`config.services.foo.dependencies[0]\` is not a string"`,
      )
      expect(
        _v({
          services: {
            foo: { dependencies: ['bar'], command: 'foo' },
            bar: { command: 'bar' },
          },
        }),
      ).toBeUndefined()
    })
    it('command property', async () => {
      expect(_vs({ command: true })).toMatchInlineSnapshot(
        `"\`config.services.foo.command\` is none of string, 1 more"`,
      )
      expect(_vs({ command: '' })).toMatchInlineSnapshot(
        `"\`config.services.foo.command\` is empty"`,
      )
      expect(_vs({ command: 'foo' })).toBeUndefined()
      expect(_vs({ command: [] })).toMatchInlineSnapshot(
        `"\`config.services.foo.command\` is empty"`,
      )
      expect(_vs({ command: [''] })).toMatchInlineSnapshot(
        `"\`config.services.foo.command\` is empty"`,
      )
      expect(_vs({ command: ['foo'] })).toBeUndefined()
      expect(_vs({ command: ['foo', false] })).toMatchInlineSnapshot(`
        "\`config.services.foo.command\` is none of string, 1 more
            \`config.services.foo.command[1]\` is not a string"
      `)
      expect(_vs({ command: ['foo', ''] })).toBeUndefined()
    })
    it('other properties', () => {
      expect(_vs({ cwd: false })).toMatchInlineSnapshot(
        `"\`config.services.foo.cwd\` is not a string"`,
      )
      expect(_vs({ cwd: 'foo' })).toBeUndefined()
      expect(_vs({ env: false })).toMatchInlineSnapshot(
        `"\`config.services.foo.env\` is not an object"`,
      )
      expect(_vs({ env: {} })).toBeUndefined()
      expect(_vs({ ready: false })).toMatchInlineSnapshot(
        `"\`config.services.foo.ready\` is not a function"`,
      )
      expect(
        _vs({
          ready: () => {},
        }),
      ).toBeUndefined()
      expect(_vs({ onCrash: false })).toMatchInlineSnapshot(
        `"\`config.services.foo.onCrash\` is not a function"`,
      )
      expect(
        _vs({
          onCrash: () => {},
        }),
      ).toBeUndefined()
      expect(_vs({ logTailLength: false })).toMatchInlineSnapshot(
        `"\`config.services.foo.logTailLength\` is not a number"`,
      )
      expect(_vs({ logTailLength: 1 })).toBeUndefined()
      expect(_vs({ minimumRestartDelay: false })).toMatchInlineSnapshot(
        `"\`config.services.foo.minimumRestartDelay\` is not a number"`,
      )
      expect(_vs({ minimumRestartDelay: 1 })).toBeUndefined()
    })
  })
})
