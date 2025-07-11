import { PlayerMoveCommands } from "./api/dto/player-move-commands";
import { PlayerResponse } from "./api/dto/player-response";
import { PlayerResponseWithErrors } from "./api/dto/player-response-with-errors";
import { getArena } from "./api/methods/get-arena";
import { tryMove } from "./api/methods/move";
import { register } from "./api/methods/register";
import { mongodb } from "./context";
import { MONGODB_DBNAME } from "./env";

function enableAutoRegistration() {
  setInterval(async () => {
    const data = await register();
    if (data) {
      console.log(data);
    }
  }, 60_000);
}

type LogState = {
  action?: PlayerMoveCommands;
  state: PlayerResponse | PlayerResponseWithErrors;
};

class Logger {
  static logState(action: LogState["action"], state: LogState["state"]): void {
    mongodb
      .db(MONGODB_DBNAME)
      .collection("state")
      .insertOne({ action, state } satisfies LogState)
      .catch(console.log);
  }
}

export class Api {
  constructor() {
    enableAutoRegistration();
  }

  public async refresh(): Promise<PlayerResponse | void> {
    const response = await getArena();
    console.log(response);
    if (response) {
      Logger.logState(undefined, response);
      return response;
    }
  }

  public async move(
    request: PlayerMoveCommands
  ): Promise<PlayerResponseWithErrors | void> {
    const response = await tryMove(request);
    if (response) {
      Logger.logState(request, response);
    }
  }
}
