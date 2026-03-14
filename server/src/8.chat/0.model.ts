export interface IMessage {
  content: string;
  isUser: boolean;
}

export interface IContext {
  Id?: number;
  explanation: string;
  messages: IMessage[];
}
