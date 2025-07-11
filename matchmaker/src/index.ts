import { connectPostgres } from "./connections/connect-db";
import { connectEventBus } from "./connections/connect-event-bus";
import { game } from "./context";

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

const eventHandlers: Record<string, Function> = {
  "round:new": game.startRound,
  "round:ended": game.stopRound,
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
