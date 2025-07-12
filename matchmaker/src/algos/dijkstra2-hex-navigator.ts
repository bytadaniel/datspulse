import { Ant, PlayerEnemy, Tile } from "../api/dto/player-response";

type HexPoint = { q: number; r: number };
type Cell = {
  known: boolean;
  passable: boolean;
  cost: number;
  damage?: number;
  distance?: number;
  previous?: string;
};

export class HexNavigator {
  private knownMap: Map<string, Cell>;
  private houses: HexPoint[];
  private unitPositions: Map<string, number>;

  constructor(houses: HexPoint[]) {
    this.knownMap = new Map();
    this.houses = houses;
    this.unitPositions = new Map();

    houses.forEach((house) => {
      const key = this.pointToKey(house);
      this.knownMap.set(key, {
        known: true,
        passable: true,
        cost: 0,
        distance: 0,
      });
    });
  }

  public updateMap(tiles: Tile[]): void {
    tiles.forEach((tile) => {
      const key = this.pointToKey(tile);
      let passable = tile.type !== 5;
      let damage = tile.type === 6 ? 10 : 0;
      let cost = tile.cost;

      this.knownMap.set(key, {
        known: true,
        passable,
        cost,
        damage,
        distance: undefined,
        previous: undefined,
      });
    });

    // Восстанавливаем расстояние для домов
    this.houses.forEach((house) => {
      const key = this.pointToKey(house);
      const houseCell = this.knownMap.get(key);
      if (houseCell) {
        houseCell.distance = 0;
      }
    });

    this.calculateDistances();
  }

  public updateUnits(units: (Ant | PlayerEnemy)[]): void {
    this.unitPositions.clear();
    units.forEach((unit) => {
      const key = this.pointToKey(unit);
      this.unitPositions.set(key, unit.type);
    });
  }

  private calculateDistances(): void {
    const queue: { point: HexPoint; cost: number }[] = [];
    const visited = new Set<string>();

    // Initialize with homes
    this.houses.forEach((house) => {
      const key = this.pointToKey(house);
      const houseCell = this.knownMap.get(key);
      if (houseCell) {
        queue.push({ point: house, cost: 0 });
        visited.add(key);
      }
    });

    while (queue.length > 0) {
      queue.sort((a, b) => a.cost - b.cost);
      const { point, cost } = queue.shift()!;
      const currentKey = this.pointToKey(point);
      const currentCell = this.knownMap.get(currentKey);
      if (!currentCell) continue;

      // Process neighbors
      this.getNeighborOffsets().forEach(([dq, dr]) => {
        const neighbor = { q: point.q + dq, r: point.r + dr };
        const neighborKey = this.pointToKey(neighbor);

        if (visited.has(neighborKey)) return;

        const neighborCell = this.knownMap.get(neighborKey);
        if (!neighborCell || !neighborCell.known || !neighborCell.passable)
          return;

        const newCost = cost + neighborCell.cost;
        const currentDistance = neighborCell.distance ?? Infinity;

        // Update if we found a better path
        if (newCost < currentDistance) {
          neighborCell.distance = newCost;
          neighborCell.previous = currentKey;

          // Re-add to queue with new cost
          visited.add(neighborKey);
          queue.push({ point: neighbor, cost: newCost });
        }
      });
    }
  }

  public getHomeFrom(point: HexPoint, unitType: number): HexPoint[] {
    const path: HexPoint[] = [];
    let currentKey: string | undefined = this.pointToKey(point);

    while (currentKey) {
      const [q, r] = currentKey.split(",").map(Number);
      path.push({ q, r });

      const cell = this.knownMap.get(currentKey);
      currentKey = cell?.previous;
    }

    return path;
  }

  public getBestDirection(ant: Ant): HexPoint | null {
    const currentPos = { q: ant.q, r: ant.r };
    let bestDirection: HexPoint | null = null;
    let bestScore = Infinity;

    this.getNeighborOffsets().forEach(([dq, dr]) => {
      const neighbor = { q: currentPos.q + dq, r: currentPos.r + dr };
      const neighborKey = this.pointToKey(neighbor);
      const neighborCell = this.knownMap.get(neighborKey);

      // Skip if cell is blocked by unit of same type
      const unitOnCell = this.unitPositions.get(neighborKey);
      if (unitOnCell !== undefined && unitOnCell === ant.type) {
        return;
      }

      if (!neighborCell || !neighborCell.known || !neighborCell.passable)
        return;

      let score = neighborCell.distance ?? Infinity;

      // Avoid deadly paths for weak ants
      if (neighborCell.damage && ant.health <= neighborCell.damage) {
        score += 1000;
      }

      if (score < bestScore) {
        bestScore = score;
        bestDirection = { q: dq, r: dr };
      }
    });

    return bestDirection;
  }

  public getDistance(point: HexPoint): number | undefined {
    const key = this.pointToKey(point);
    return this.knownMap.get(key)?.distance;
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
