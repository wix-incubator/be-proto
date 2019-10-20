
export namespace be {
  export interface HttpBinding {
    bind<REQ, RES>(req: (REQ) => Promise<RES>): HttpBinding;
  }
}
