import { ActionRequest, ActionResponse } from "../types";

export class Player {
  public allowActions() {
    throw new Error("Method not implemented.");
  }

  public restrictActions() {
    throw new Error("Method not implemented.");
  }

  public async act(state: ActionRequest): Promise<ActionResponse> {
    return Promise.resolve(void state);
  }
}
