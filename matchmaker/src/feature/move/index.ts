import { AntMoveCommand } from "../../api/dto/player-move-commands";
import { Ant, Hex, PlayerResponse } from "../../api/dto/player-response";

export class AutoMoveClass {
  private randomDirection(q: number, r: number): { q: number; r: number } {
    const neighbours = [
      { q: q, r: r - 1 }, // Северо-запад
      { q: q, r: r + 1 }, // Юго-восток
      { q: q - 1, r: r }, // Северо-восток
      { q: q + 1, r: r }, // Юго-запад
      { q: q - 1, r: r + 1 }, // Восток
      { q: q + 1, r: r - 1 }, // Запад
    ];
    return neighbours[Math.floor(Math.random() * neighbours.length)];
  }

  private generatePath(ant: Ant, from: Hex): Hex[] {
    // if (state.home.some((c) => c.q === next.q && c.r === next.r)) {
    //   return this.generatePath(state, ant, depth + 1);
    // }

    // if (state.enemies.some((c) => c.q === next.q && c.r === next.r)) {
    //   return this.generatePath(state, ant, depth + 1);
    // }

    // if (state.food.some((c) => c.q === next.q && c.r === next.r)) {
    //   return this.generatePath(state, ant, depth + 1);
    // }

    // if (
    //   state.ants.some(
    //     (c) => c.q === next.q && c.r === next.r && from.type === c.type
    //   )
    // ) {
    //   return this.generatePath(state, from, depth + 1);
    // }

    const p1 = this.randomDirection(from.q, from.r);
    const p2 = this.randomDirection(p1.q, p1.r);
    const p3 = this.randomDirection(p2.q, p2.r);
    const p4 = this.randomDirection(p3.q, p3.r);

    return [p1, p2, p3, p4];
  }

  runAutoMove(ants: Ant[]): AntMoveCommand[] {
    return ants.map((ant) => {
      return {
        ant: ant.id,
        path: this.generatePath(ant, ant),
      };
    });
  }
}
