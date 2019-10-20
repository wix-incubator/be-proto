export function builder(): ServerBuilder;

export function fromProtoModules(contextOptions: object, bindings: object): BindingsSource;

export interface ServerBuilder {
  withBindings(bindings: be.HttpBinding)
  withBindingsSource(bindingsSource: BindingsSource)
  start(options: StartOptions): Promise<Server>
}

export interface Server {
  stop(): void
}

export abstract class ServerLauncher {
  public static embedded(require: () => void, options: StartOptions): Promise<Server>;
}

export interface BindingsSource {
}

export interface StartOptions {
  port: int
}

