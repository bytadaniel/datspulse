import { PlayerMoveCommands } from "../dto/player-move-commands";
import { PlayerResponseWithErrors } from "../dto/player-response-with-errors";
import { httpClient } from "../http-client";

export async function move(
  request: PlayerMoveCommands
): Promise<PlayerResponseWithErrors | void> {
  try {
    const response = await httpClient.post("/api/move", request);

    if (!response.data.home?.length) {
      return;
    }

    if (response.status !== 200) {
      return console.log(
        "Move request failed with status",
        response.status,
        response.data
      );
    }

    return response.data;
  } catch (error) {
    console.log("Move request failed", error);
  }
}
