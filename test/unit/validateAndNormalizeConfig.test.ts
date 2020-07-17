import { validateAndNormalizeConfig } from '../../src/core/validateAndNormalizeConfig'
import { CompositeServiceConfig } from '../../src/core/CompositeServiceConfig'

function getValidationErrors(config: unknown) {
  const errors: string[] = []
  validateAndNormalizeConfig(errors, config as CompositeServiceConfig)
  return errors
}

describe('validateAndNormalizeConfig', () => {
  it('CompositeServiceConfig properties', () => {
    expect(
      getValidationErrors({
        services: { ok: { command: 'foo' } },
        logLevel: 'bad',
      }),
    ).toMatchInlineSnapshot(`
      Array [
        "config.logLevel is not one of 'error', 'info', 'debug'",
      ]
    `)
    expect(getValidationErrors({})).toMatchInlineSnapshot(`
      Array [
        "config.services is not defined",
      ]
    `)
    expect(getValidationErrors({ services: 'bad' })).toMatchInlineSnapshot(`
      Array [
        "config.services is not an object",
      ]
    `)
    expect(
      getValidationErrors({
        services: { none: undefined, nope: null, nah: false, nono: '', no: 0 },
      }),
    ).toMatchInlineSnapshot(`
      Array [
        "config.services has no actual entries",
      ]
    `)
    expect(
      getValidationErrors({
        services: {
          bad1: true,
          bad2: 'bad',
          bad3: 1,
        },
      }),
    ).toMatchInlineSnapshot(`
      Array [
        "config.services.bad1 is not an object",
        "config.services.bad2 is not an object",
        "config.services.bad3 is not an object",
      ]
    `)
    expect(
      getValidationErrors({
        services: { ok: { command: 'foo' } },
        unknownProperty1: true,
        unknownProperty2: false,
      }),
    ).toMatchInlineSnapshot(`
      Array [
        "config has unknown property 'unknownProperty1'",
        "config has unknown property 'unknownProperty2'",
      ]
    `)
  })
  describe('ServiceConfig properties', () => {
    it('dependencies', () => {
      expect(
        getValidationErrors({
          services: {
            a: { command: 'foo' },
            b: { command: 'foo', dependencies: ['A'] },
          },
        }),
      ).toMatchInlineSnapshot(`
        Array [
          "config.services.b.dependencies contains invalid service id 'A'",
        ]
      `)
      expect(
        getValidationErrors({
          services: {
            a: { command: 'foo', dependencies: ['b'] },
            b: { command: 'foo', dependencies: ['c'] },
            c: { command: 'foo', dependencies: ['a'] },
          },
        }),
      ).toMatchInlineSnapshot(`
        Array [
          "config.services.a has cyclic dependency a -> b -> c -> a",
          "config.services.b has cyclic dependency b -> c -> a -> b",
          "config.services.c has cyclic dependency c -> a -> b -> c",
        ]
      `)
    })
    it('command', () => {
      // TODO: test normalization result
      expect(
        getValidationErrors({
          services: {
            ok1: { command: 'foo bar' },
            ok2: { command: ['foo', 'bar'] },
            bad1: {},
            bad2: { command: '' },
            bad3: { command: [] },
            bad4: { command: ['foo', 'bar', null] },
          },
        }),
      ).toMatchInlineSnapshot(`
        Array [
          "config.services.bad1.command is not defined",
          "config.services.bad2.command is empty",
          "config.services.bad3.command is empty",
          "config.services.bad4.command is not a string or an array of strings",
        ]
      `)
    })
    it('env', () => {
      // TODO: test normalization result
      expect(
        getValidationErrors({
          services: {
            ok1: { command: 'foo', env: undefined },
            ok2: { command: 'foo', env: { FOO: 'str', BAR: 3 } },
            bad1: { command: 'foo', env: false },
            bad2: { command: 'foo', env: null },
            bad3: { command: 'foo', env: { FOO: false, BAR: null } },
          },
        }),
      ).toMatchInlineSnapshot(`
        Array [
          "config.services.bad1.env is not an object",
          "config.services.bad2.env is not an object",
          "config.services.bad3.env.FOO is not a string, number, or undefined",
          "config.services.bad3.env.BAR is not a string, number, or undefined",
        ]
      `)
    })
    it('...rest', () => {
      expect(
        getValidationErrors({
          services: {
            bad: {
              command: 'foo',
              cwd: false,
              ready: false,
              onCrash: false,
              logTailLength: false,
              minimumRestartDelay: false,
            },
          },
        }),
      ).toMatchInlineSnapshot(`
        Array [
          "config.services.bad.cwd is not a string",
          "config.services.bad.ready is not a function",
          "config.services.bad.onCrash is not a function",
          "config.services.bad.logTailLength is not a number",
          "config.services.bad.minimumRestartDelay is not a number",
        ]
      `)
    })
    it('unknown property', () => {
      expect(
        getValidationErrors({
          services: {
            bad: {
              command: 'foo',
              unknownProperty1: true,
              unknownProperty2: false,
            },
          },
        }),
      ).toMatchInlineSnapshot(`
        Array [
          "config.services.bad has unknown property 'unknownProperty1'",
          "config.services.bad has unknown property 'unknownProperty2'",
        ]
      `)
    })
  })
})
