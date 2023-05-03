import { getTypeSuite } from "ts-interface-builder/macro";
import { createCheckers, IErrorDetail } from "ts-interface-checker";
import { CompositeServiceConfig } from "./interfaces/CompositeServiceConfig";
import { ServiceConfig } from "./interfaces/ServiceConfig";
import { LogLevel } from "./Logger";
import { ReadyContext } from "./interfaces/ReadyContext";
import { OnCrashContext } from "./interfaces/OnCrashContext";

export interface NormalizedCompositeServiceConfig {
  logLevel: LogLevel;
  gracefulShutdown: boolean;
  windowsCtrlCShutdown: boolean;
  services: { [id: string]: NormalizedServiceConfig };
}

export interface NormalizedServiceConfig {
  dependencies: string[];
  cwd: string;
  command: string[];
  env: { [key: string]: string };
  ready: (ctx: ReadyContext) => Promise<void>;
  forceKillTimeout: number;
  onCrash: (ctx: OnCrashContext) => void;
  crashesLength: number;
  logTailLength: number;
  minimumRestartDelay: number;
}

export function validateAndNormalizeConfig(
  config: CompositeServiceConfig,
): NormalizedCompositeServiceConfig {
  validateType("CompositeServiceConfig", "config", config);

  const { logLevel = "info" } = config;
  const windowsCtrlCShutdown = process.platform === "win32" && Boolean(config.windowsCtrlCShutdown);
  const gracefulShutdown = !windowsCtrlCShutdown && Boolean(config.gracefulShutdown);
  const { serviceDefaults = {} } = config;
  doExtraServiceConfigChecks("config.serviceDefaults", serviceDefaults);

  const truthyServiceEntries = Object.entries(config.services).filter(([, value]) => value) as [
    string,
    ServiceConfig,
  ][];
  if (truthyServiceEntries.length === 0) {
    throw new ConfigValidationError("`config.services` has no entries");
  }
  const services: { [id: string]: NormalizedServiceConfig } = {};
  for (const [id, config] of truthyServiceEntries) {
    services[id] = processServiceConfig(id, config, serviceDefaults);
  }
  validateDependencyTree(services);

  return {
    logLevel,
    gracefulShutdown,
    windowsCtrlCShutdown,
    services,
  };
}

/**
 * Structural validations for ServerConfig not covered by validateType/ts-interface-checker
 */
function doExtraServiceConfigChecks(path: string, config: ServiceConfig) {
  if (
    typeof config.command !== "undefined" &&
    (Array.isArray(config.command)
      ? !config.command.length || !config.command[0].trim()
      : !config.command.trim())
  ) {
    throw new ConfigValidationError(`\`${path}.command\` has no binary part`);
  }
}

const serviceBaseDefaults = {
  dependencies: [],
  cwd: ".",
  command: undefined, // no default command
  env: process.env,
  ready: () => Promise.resolve(),
  forceKillTimeout: 5000,
  onCrash: (ctx: OnCrashContext) => {
    if (!ctx.isServiceReady) throw new Error("Crashed before becoming ready");
  },
  crashesLength: 0,
  logTailLength: 0,
  minimumRestartDelay: 0,
};

function processServiceConfig(
  id: string,
  config: ServiceConfig,
  defaults: ServiceConfig,
): NormalizedServiceConfig {
  const path = `config.services.${id}`;
  validateType("ServiceConfig", path, config);
  doExtraServiceConfigChecks(path, config);
  const merged = {
    ...serviceBaseDefaults,
    ...removeUndefinedProperties(defaults),
    ...removeUndefinedProperties(config),
  };
  if (merged.command === undefined) {
    throw new ConfigValidationError(`\`${path}.command\` is not defined`);
  }
  return {
    ...merged,
    command: normalizeCommand(merged.command),
    env: normalizeEnv(merged.env),
  };
}

function removeUndefinedProperties<T extends { [key: string]: any }>(object: T): T {
  const result = { ...object };
  for (const [key, value] of Object.entries(result)) {
    if (value === undefined) {
      delete result[key];
    }
  }
  return result;
}

function normalizeCommand(command: string | string[]): string[] {
  return Array.isArray(command) ? command : command.split(/\s+/).filter(Boolean);
}

function normalizeEnv(env: { [p: string]: string | number | undefined }): { [p: string]: string } {
  return Object.fromEntries(
    Object.entries(env)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, String(value)]),
  );
}

function validateDependencyTree(services: { [id: string]: NormalizedServiceConfig }): void {
  const serviceIds = Object.keys(services);
  for (const [serviceId, { dependencies }] of Object.entries(services)) {
    for (const dependency of dependencies) {
      if (!serviceIds.includes(dependency)) {
        throw new ConfigValidationError(
          `Service "${serviceId}" depends on unknown service "${dependency}"`,
        );
      }
      if (services[dependency].ready === serviceBaseDefaults.ready) {
        throw new ConfigValidationError(
          `Service "${serviceId}" depends on service "${dependency}" which has no defined \`ready\` config`,
        );
      }
    }
  }

  for (const serviceId of serviceIds) {
    validateNoCyclicDeps(serviceId, []);
  }

  function validateNoCyclicDeps(serviceId: string, path: string[]) {
    const isLooped = path.includes(serviceId);
    if (isLooped) {
      throw new ConfigValidationError(
        `Service "${serviceId}" has cyclic dependency ${path
          .slice(path.indexOf(serviceId))
          .concat(serviceId)
          .join(" -> ")}`,
      );
    }
    for (const dep of services[serviceId].dependencies) {
      validateNoCyclicDeps(dep, [...path, serviceId]);
    }
    return null;
  }
}

export class ConfigValidationError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, ConfigValidationError.prototype);
  }
}

ConfigValidationError.prototype.name = ConfigValidationError.name;

const tsInterfaceBuilderOptions = { ignoreIndexSignature: true };
const checkers = createCheckers({
  ...getTypeSuite("./interfaces/CompositeServiceConfig.ts", tsInterfaceBuilderOptions),
  ...getTypeSuite("./interfaces/ServiceConfig.ts", tsInterfaceBuilderOptions),
});

function validateType(typeName: string, reportedPath: string, value: any) {
  const checker = checkers[typeName];
  checker.setReportedPath(reportedPath);
  const error = checker.validate(value);
  if (error) {
    throw new ConfigValidationError(getErrorMessage(error[0]));
  }
}

function getErrorMessage(error: IErrorDetail): string {
  return getErrorMessageLines(error).join("\n");
}

function getErrorMessageLines(error: IErrorDetail): string[] {
  let result = [`\`${error.path}\` ${error.message}`];
  if (error.nested) {
    for (const nested of error.nested) {
      result = result.concat(getErrorMessageLines(nested).map((s) => `    ${s}`));
    }
  }
  return result;
}
