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

  private generatePath(state: PlayerResponse, ant: Ant, maxDepth = 10): Hex[] {
    let depth = 0;
    depth++;
    if (depth > maxDepth) {
      return []; // стоим на месте
    }

    const next = this.randomDirection(ant.q, ant.r);
    if (state.home.some((c) => c.q === next.q && c.r === next.r)) {
      return this.generatePath(state, ant);
    }

    if (state.enemies.some((c) => c.q === next.q && c.r === next.r)) {
      return this.generatePath(state, ant);
    }

    if (state.food.some((c) => c.q === next.q && c.r === next.r)) {
      return this.generatePath(state, ant);
    }

    if (
      state.ants.some(
        (c) => c.q === next.q && c.r === next.r && ant.type === c.type
      )
    ) {
      return this.generatePath(state, ant);
    }

    return [next];
  }

  runAutoMove(state: PlayerResponse, ants: Ant[]): AntMoveCommand[] {
    return ants.map((ant) => {
      return {
        ant: ant.id,
        path: this.generatePath(state, ant),
      };
    });
  }
}
