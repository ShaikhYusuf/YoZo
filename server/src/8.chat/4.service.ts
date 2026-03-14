import { inject } from "inversify";
import TYPE from "../ioc/types";
import { container } from "../ioc/container";

import { IContext, IMessage } from "./0.model";
import { IServiceChat } from "./3.service.model";

export class ServiceChatImpl implements IServiceChat {
  constructor() {}

  async create(inChatInfo: IContext): Promise<IMessage | null> {
    let retObject = {
      content: "Context string",
      isUser: false,
    };
    return retObject;
  }
}
