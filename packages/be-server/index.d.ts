export function builder(): ServerBuilder;

export function fromProtoModules(contextOptions: object, bindings: object): BindingsSource;

export interface ServerBuilder {
  withBindings(bindings: Binding[])
  withBindingsSource(bindingsSource: BindingsSource)
  start(options: StartOptions): Promise<Server>
}

export interface Server {
  stop(): void
}

export interface Binding {
  binding: HttpBinding
  invoke: (request: any, options?: object) => any
}

export interface BindingsSource {

}

export interface StartOptions {
  port: int
}

