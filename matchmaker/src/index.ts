import { connectPostgres } from "./connections/connect-db";
import { connectEventBus } from "./connections/connect-event-bus";
import { game } from "./context";
import { ActionRequest, ActionResponse } from "./types";

/**
 * Boilerplate
 */
abstract class EventBus {
  abstract consumeMessages(onMessage: (message: string) => Promise<void>): void;
}
const eventBus: InstanceType<typeof EventBus> = {
  consumeMessages: (onMessage: (message: string) => Promise<void>): void => {
    void onMessage;
    setInterval(() => console.log(Date.now(), "ping-pong"), 30_000);
  },
};

export class ActionRequestFactory {
  static create(payload: unknown): ActionRequest {
    return {};
  }
}

export class StateExceptionFactory {
  static create(error: Error): unknown {
    return {};
  }
}

export class Logger {
  static async logAction(
    request: ActionRequest,
    response: ActionResponse
  ): Promise<void> {
    void request;
    void response;
    return Promise.resolve();
  }

  static async logException(request: ActionRequest, response: unknown) {
    void request;
    void response;
    return Promise.resolve();
  }
}

const eventHandlers: Record<string, Function> = {
  "round:new": game.startRound,
  "round:ended": game.stopRound,
  "action:ready": async (payload: unknown) => {
    const request = ActionRequestFactory.create(payload);
    try {
      const response = await game.player.act(request);
      await Logger.logAction(request, response);
    } catch (error) {
      const response = StateExceptionFactory.create(error as Error);
      await Logger.logException(request, response);
    }
  },
};

(async function () {
  await connectPostgres();
  await connectEventBus();

  eventBus.consumeMessages(async (message) => {
    const messageHandler = eventHandlers[message];
    try {
      await messageHandler();
    } catch (error) {
      console.log(error);
    }
  });
})();
