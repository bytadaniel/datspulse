import { httpClient } from "../http-client";

export type PlayerRegistration = {
  lobbyEndsIn: number;
  name: string;
  nextTurn: number;
  realm: string;
};

export async function register(): Promise<PlayerRegistration | void> {
  try {
    const response = await httpClient.post("/api/register");

    if (response.status !== 200) {
      console.log(
        "Register request failed with status",
        response.status,
        response.data
      );

      return response.data;
    }
  } catch (error) {
    console.log("Register request failed", error);
  }
}
