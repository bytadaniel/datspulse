import { AntMoveCommand } from "../api/dto/player-move-commands";
import { Ant, PlayerEnemy, Tile } from "../api/dto/player-response";

type HexPoint = { q: number; r: number };
type Cell = {
  known: boolean;
  passable: boolean;
  cost: number;
  damage?: number;
  type?: number;
  isEnemyBase?: boolean;
};

export type UnitTarget = {
  ant: Ant;
  target: HexPoint;
};

// Константы скоростей юнитов
const UNIT_SPEEDS: Record<number, number> = {
  0: 5, // Рабочий
  1: 4, // Боец
  2: 7, // Разведчик
};

export class PathPlanner {
  private knownMap: Map<string, Cell>;
  private unitPositions: Map<string, { type: number; isEnemy: boolean }>;
  private myHome: HexPoint[];
  private blockedCells: Set<string>;

  constructor(myHome: HexPoint[]) {
    this.knownMap = new Map();
    this.myHome = myHome;
    this.unitPositions = new Map();
    this.blockedCells = new Set();
  }

  public updateMap(tiles: Tile[]): void {
    tiles.forEach((tile) => {
      const key = this.pointToKey(tile);
      let passable = true;

      // Камень всегда непроходим
      if (tile.type === 5) {
        passable = false;
      }
      // Вражеские муравейники проходимы (кроме основного гекса)
      else if (tile.type === 1 && !this.isPointInHome(tile)) {
        // Для вражеских баз проходимы все гексы, кроме основного
        // Но мы не знаем, какой гекс основной, поэтому все проходимы
        passable = true;
      }

      this.knownMap.set(key, {
        known: true,
        passable,
        cost: tile.cost,
        damage: tile.type === 4 ? 20 : undefined,
        type: tile.type,
        isEnemyBase: tile.type === 1 && !this.isPointInHome(tile),
      });
    });
  }

  private isPointInHome(point: HexPoint): boolean {
    return this.myHome.some((h) => h.q === point.q && h.r === point.r);
  }

  public updateUnits(ants: Ant[], enemies: PlayerEnemy[]): void {
    this.unitPositions.clear();
    this.blockedCells.clear();

    // Обновляем позиции всех юнитов
    [...ants, ...enemies].forEach((unit) => {
      const key = this.pointToKey(unit);
      this.unitPositions.set(key, {
        type: unit.type,
        isEnemy: "id" in unit ? false : true,
      });
    });
  }

  public planMoves(unitTargets: UnitTarget[]): AntMoveCommand[] {
    const commands: AntMoveCommand[] = [];
    const reservedCells = new Map<string, number>();
    const speedConfig = UNIT_SPEEDS;

    // Сортировка по приоритету: рабочие > разведчики > бойцы
    const sortedTargets = [...unitTargets].sort((a, b) =>
      a.ant.type === 0 ? -1 : b.ant.type === 0 ? 1 : a.ant.type - b.ant.type
    );

    for (const { ant, target } of sortedTargets) {
      const path = this.calculatePath(ant, target, reservedCells, speedConfig);
      commands.push({
        ant: ant.id,
        path: path,
      });

      // Резервируем все клетки пути (кроме начальной)
      for (let i = 1; i < path.length; i++) {
        const point = path[i];
        reservedCells.set(this.pointToKey(point), ant.type);
      }
    }

    return commands;
  }

  private calculatePath(
    ant: Ant,
    target: HexPoint,
    reservedCells: Map<string, number>,
    speedConfig: Record<number, number>
  ): HexPoint[] {
    const speed = speedConfig[ant.type] || 4;
    const path: HexPoint[] = [];
    let currentPoint = { q: ant.q, r: ant.r };
    let remainingOP = speed;
    // Пытаемся построить путь пока есть ОП
    while (remainingOP > 0) {
      const nextPoint = this.findNextStep(
        ant,
        currentPoint,
        target,
        reservedCells,
        remainingOP
      );
      // Если не нашли следующий шаг - прерываем
      if (!nextPoint) break;
      // Проверяем движение на месте - прерываем если стоим
      if (nextPoint.q === currentPoint.q && nextPoint.r === currentPoint.r) {
        break;
      }
      const cell = this.knownMap.get(this.pointToKey(nextPoint));
      if (!cell) break;
      // Добавляем только если это не текущая позиция
      path.push(nextPoint);
      remainingOP -= cell.cost;
      currentPoint = nextPoint;
      // Если достигли цели - останавливаемся
      if (currentPoint.q === target.q && currentPoint.r === target.r) {
        break;
      }
    }
    return path;
  }

  private findNextStep(
    ant: Ant,
    current: HexPoint,
    target: HexPoint,
    reservedCells: Map<string, number>,
    remainingOP: number
  ): HexPoint | null {
    const moves: HexPoint[] = [];
    // Проверяем соседние клетки (убираем возможность стоять на месте)
    for (const [dq, dr] of this.getNeighborOffsets()) {
      const newPoint = { q: current.q + dq, r: current.r + dr };
      const newKey = this.pointToKey(newPoint);
      const cell = this.knownMap.get(newKey);
      // Базовые проверки доступности
      if (!cell || !cell.known || !cell.passable) continue;
      // Проверка ОП: достаточно ли для шага
      if (cell.cost > remainingOP) continue;
      // Проверка статической занятости
      const unit = this.unitPositions.get(newKey);
      if (unit) {
        if (unit.isEnemy) continue;
        if (!unit.isEnemy && unit.type === ant.type) continue;
      }
      // Проверка динамической занятости
      const reservedType = reservedCells.get(newKey);
      if (reservedType !== undefined && reservedType === ant.type) {
        continue;
      }
      moves.push(newPoint);
    }
    // Если нет доступных ходов, возвращаем null вместо стояния на месте
    if (moves.length === 0) return null;
    return this.selectBestMove(ant, moves, target);
  }

  private selectBestMove(
    ant: Ant,
    moves: HexPoint[],
    target: HexPoint
  ): HexPoint | null {
    if (moves.length === 0) return null;

    let bestMove: HexPoint = moves[0];
    let minDistance = Infinity;

    for (const move of moves) {
      const distance = this.getDistance(move, target);
      const cell = this.knownMap.get(this.pointToKey(move))!;

      // Штрафы и бонусы
      let penalty = 0;
      let bonus = 0;

      // Бонус за движение к вражеской базе для бойцов
      if (cell.isEnemyBase && ant.type === 1) {
        bonus -= 50;
      }

      // Избегаем смертельных клеток
      if (cell.damage && ant.health <= cell.damage) {
        penalty += 1000;
      }

      // Штраф за кислоту
      if (cell.type === 4) {
        penalty += 20;
      }

      // Штраф за грязь
      if (cell.type === 3) {
        penalty += 10;
      }

      // Штраф за стояние на месте
      if (move.q === ant.q && move.r === ant.r) {
        penalty += 5;
      }

      const totalScore = distance + penalty - bonus;

      if (totalScore < minDistance) {
        minDistance = totalScore;
        bestMove = move;
      }
    }

    return bestMove;
  }

  // Публичный метод для получения расстояния
  public getDistance(a: HexPoint, b: HexPoint): number {
    return (
      (Math.abs(a.q - b.q) +
        Math.abs(a.r - b.r) +
        Math.abs(a.q + a.r - b.q - b.r)) /
      2
    );
  }

  private pointToKey(point: HexPoint): string {
    return `${point.q},${point.r}`;
  }

  private getNeighborOffsets(): [number, number][] {
    return [
      [1, 0],
      [1, -1],
      [0, -1],
      [-1, 0],
      [-1, 1],
      [0, 1],
    ];
  }
}
