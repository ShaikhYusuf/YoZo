import { IContext, IMessage } from "./0.model";

export interface IServiceChat {
  create(inChatInfo: IContext): Promise<IMessage | null>;
}
