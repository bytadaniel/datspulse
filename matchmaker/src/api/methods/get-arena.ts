import { PlayerResponse } from "../dto/player-response";
import { httpClient } from "../http-client";

export async function getArena(): Promise<PlayerResponse | void> {
  try {
    const response = await httpClient.get("/api/arena");

    if (!response.data.home?.length) {
      return;
    }

    if (response.status !== 200) {
      return console.log(
        "Get arena request failed with status",
        response.status,
        response.data
      );
    }

    return response.data as PlayerResponse;
  } catch (error) {
    console.log("Get arena request failed", error);
  }
}
