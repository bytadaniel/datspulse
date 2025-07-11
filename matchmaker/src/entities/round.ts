import { Player } from "./player";

export class Round {
  private readonly startAt: Date;
  private endAt: Date | null;

  constructor(private readonly player: Player) {
    this.startAt = new Date();
    this.endAt = null;
    this.player.allowActions();
  }

  public stop() {
    this.endAt = new Date();
    this.player.restrictActions();
  }
}
