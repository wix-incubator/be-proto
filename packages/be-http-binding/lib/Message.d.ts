declare namespace be {
    
  abstract class Message {
    static fromValue<T extends Message>(value: any): T
  }

}

export = be;