import { AsyncLocalStorage } from "async_hooks";
import { injectable } from "inversify";

export class RequestContext {
  tenantId: string | null = null;
  traceparent: string | null = null;
  databaseConnection: any | null = null;
}

@injectable()
export class RequestContextProvider {
  private asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

  run(context: RequestContext, callback: () => void) {
    this.asyncLocalStorage.run(context, callback);
  }

  get(): RequestContext | undefined {
    return this.asyncLocalStorage.getStore();
  }
}
