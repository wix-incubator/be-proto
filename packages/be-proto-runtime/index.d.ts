
export namespace be {
  export interface HttpBinding {
    bind<REQ, RES>(req: (REQ) => Promise<RES>): HttpBinding;
  }
}

export abstract class LongValue {
  public static fromValue(value: string | number): LongValue
}
