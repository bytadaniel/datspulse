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

type UnitTarget = {
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
  private enemyHomes: HexPoint[] = [];
  private enemyMainSpot: HexPoint | null = null;
  private blockedCells: Set<string>;

  constructor(myHome: HexPoint[]) {
    this.knownMap = new Map();
    this.myHome = myHome;
    this.unitPositions = new Map();
    this.blockedCells = new Set();
  }

  public updateMap(tiles: Tile[], enemies: PlayerEnemy[]): void {
    // Обновляем информацию о вражеских муравейниках
    this.updateEnemyHomes(enemies);

    tiles.forEach((tile) => {
      const key = this.pointToKey(tile);
      let passable = true;

      // Камень всегда непроходим
      if (tile.type === 5) {
        passable = false;
      }
      // Основной гекс вражеского муравейника непроходим
      else if (this.isEnemyMainSpot(tile)) {
        passable = false;
      }

      this.knownMap.set(key, {
        known: true,
        passable,
        cost: tile.cost,
        damage: tile.type === 4 ? 20 : undefined,
        type: tile.type,
        isEnemyBase: this.isEnemyBase(tile),
      });
    });
  }

  private updateEnemyHomes(enemies: PlayerEnemy[]): void {
    // Собираем все вражеские муравейники
    this.enemyHomes = [];
    const enemyHomeMap = new Map<string, HexPoint[]>();

    enemies.forEach((enemy) => {
      if (enemy.home) {
        const homeKey = enemy.home
          .map((h) => `${h.q},${h.r}`)
          .sort()
          .join("|");
        if (!enemyHomeMap.has(homeKey)) {
          enemyHomeMap.set(homeKey, enemy.home);
          this.enemyHomes.push(...enemy.home);
        }

        // Запоминаем основной гекс вражеского муравейника
        if (enemy.spot) {
          this.enemyMainSpot = { q: enemy.spot.q, r: enemy.spot.r };
        }
      }
    });
  }

  private isEnemyBase(point: HexPoint): boolean {
    return this.enemyHomes.some(
      (home) => home.q === point.q && home.r === point.r
    );
  }

  private isEnemyMainSpot(point: HexPoint): boolean {
    return (
      this.enemyMainSpot !== null &&
      this.enemyMainSpot.q === point.q &&
      this.enemyMainSpot.r === point.r
    );
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

  public planMoves(
    unitTargets: UnitTarget[]
  ): { antId: string; path: HexPoint[] }[] {
    const commands: { antId: string; path: HexPoint[] }[] = [];
    const reservedCells = new Map<string, number>();
    const speedConfig = UNIT_SPEEDS;

    // Сортировка по приоритету: рабочие > разведчики > бойцы
    const sortedTargets = [...unitTargets].sort((a, b) =>
      a.ant.type === 0 ? -1 : b.ant.type === 0 ? 1 : a.ant.type - b.ant.type
    );

    for (const { ant, target } of sortedTargets) {
      const currentPos = { q: ant.q, r: ant.r };
      const possibleMoves = this.getPossibleMoves(
        ant,
        reservedCells,
        speedConfig
      );
      const bestMove = this.selectBestMove(ant, possibleMoves, target);

      if (bestMove) {
        // Проверяем движение на месте
        if (bestMove.q === currentPos.q && bestMove.r === currentPos.r) {
          commands.push({ antId: ant.id, path: [] });
        } else {
          commands.push({
            antId: ant.id,
            path: [bestMove],
          });
          reservedCells.set(this.pointToKey(bestMove), ant.type);
        }
      } else {
        // Полная блокировка - остаемся на месте
        commands.push({ antId: ant.id, path: [] });
      }
    }

    return commands;
  }

  private getPossibleMoves(
    ant: Ant,
    reservedCells: Map<string, number>,
    speedConfig: Record<number, number>
  ): HexPoint[] {
    const moves: HexPoint[] = [];
    const speed = speedConfig[ant.type] || 4; // Значение по умолчанию

    // Всегда можно остаться на месте
    moves.push({ q: ant.q, r: ant.r });

    // Проверяем соседние клетки
    for (const [dq, dr] of this.getNeighborOffsets()) {
      const newPoint = { q: ant.q + dq, r: ant.r + dr };
      const newKey = this.pointToKey(newPoint);
      const cell = this.knownMap.get(newKey);

      // Базовые проверки доступности
      if (!cell || !cell.known || !cell.passable) continue;

      // Проверка ОП: достаточно ли скорости
      if (cell.cost > speed) continue;

      // Проверка статической занятости
      const unit = this.unitPositions.get(newKey);
      if (unit) {
        if (unit.isEnemy) continue; // Враг на клетке
        if (!unit.isEnemy && unit.type === ant.type) continue; // Свой юнит того же типа
      }

      // Проверка динамической занятости
      const reservedType = reservedCells.get(newKey);
      if (reservedType !== undefined && reservedType === ant.type) {
        continue;
      }

      moves.push(newPoint);
    }

    return moves;
  }

  private selectBestMove(
    ant: Ant,
    moves: HexPoint[],
    target: HexPoint
  ): HexPoint | null {
    if (moves.length === 0) return null;

    let bestMove: HexPoint = moves[0];
    let minDistance = Infinity;
    let minCost = Infinity;

    for (const move of moves) {
      const distance = this.hexDistance(move.q, move.r, target.q, target.r);
      const cell = this.knownMap.get(this.pointToKey(move))!;
      const moveCost = cell.cost;

      // Штрафы и бонусы
      let penalty = 0;
      let bonus = 0;

      // Бонус за движение к цели набега
      if (cell.isEnemyBase && ant.type === 1) {
        // Бойцы
        bonus -= 50; // Сильный стимул для атаки
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

      const totalScore = distance * 10 + moveCost + penalty - bonus;

      if (totalScore < minDistance) {
        minDistance = totalScore;
        bestMove = move;
        minCost = moveCost;
      }
    }

    return bestMove;
  }

  private hexDistance(q1: number, r1: number, q2: number, r2: number): number {
    return (
      (Math.abs(q1 - q2) + Math.abs(r1 - r2) + Math.abs(q1 + r1 - q2 - r2)) / 2
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
