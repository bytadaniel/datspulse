import { Ant, PlayerResponse } from "../../api/dto/player-response";
import { getArena } from "../../api/methods/get-arena";
import { tryMove } from "../../api/methods/move";

export class AutoMoveClass {
  private roundDuration: number = 10 * 60 * 1000; // 10 минут в миллисекундах
  private turnDuration: number = 2 * 1000; // 2 секунды в миллисекундах
  private isRunning: boolean = false;
  constructor() {}

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

  private generateMoves(ants: Ant[]): Ant[] {
    return ants.map((ant) => {
      const nextPosition = this.randomDirection(ant.q, ant.r);
      ant.q = nextPosition.q;
      ant.r = nextPosition.r;
      return ant;
    });
  }

  async runAutoMove() {
    try {
      const arena = await getArena();
      const antsAfterMove = this.generateMoves((arena as PlayerResponse).ants);
      const antsMoveRequest = antsAfterMove.map((antAfterMove) => ({
        ant: antAfterMove.id,
        path: [
          {
            q: antAfterMove.q,
            r: antAfterMove.r,
          },
        ],
      }));
      await tryMove({ moves: antsMoveRequest });
    } catch (error) {
      console.error(
        "Произошла ошибка во время выполнения авто-движения:",
        error
      );
    }
  }
}
