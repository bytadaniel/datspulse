import { Player } from "./player";
import { Round } from "./round";

export class Game {
  private currentRound: Round | null;
  private readonly rounds: Round[];
  private readonly player: Player;

  constructor() {
    this.player = new Player();
    this.currentRound = null;
    this.rounds = [];
  }

  public startRound() {
    if (this.currentRound) {
      throw new Error("Current round exists");
    }
    this.currentRound = new Round(this.player);
  }

  public stopRound() {
    if (!this.currentRound) {
      throw new Error("Current round not found");
    }

    this.currentRound.stop();
    this.rounds.push(this.currentRound);
    this.currentRound = null;
  }
}
