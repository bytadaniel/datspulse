type HexPoint = { q: number; r: number };
type Cell = {
  known: boolean;
  passable: boolean;
  cost: number;
  damage?: number;
  distance?: number;
};

export class HexNavigator {
  private knownMap: Map<string, Cell>;
  private houses: HexPoint[];

  constructor(houses: HexPoint[]) {
    this.knownMap = new Map();
    this.houses = houses;

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

  public updateMap(tiles: any[]): void {
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
      // Sort only when needed (min-heap simulation)
      if (queue.length > 1) queue.sort((a, b) => a.cost - b.cost);

      const { point, cost } = queue.shift()!;
      const currentKey = this.pointToKey(point);
      const currentCell = this.knownMap.get(currentKey);

      if (!currentCell) continue;

      // Update distance only if we found a better path
      if (currentCell.distance === undefined || cost < currentCell.distance) {
        currentCell.distance = cost;
      } else if (cost > currentCell.distance) {
        // Skip if we have a better path already
        continue;
      }

      // Process neighbors
      this.getNeighborOffsets().forEach(([dq, dr]) => {
        const neighbor = { q: point.q + dq, r: point.r + dr };
        const neighborKey = this.pointToKey(neighbor);

        // Skip if already visited
        if (visited.has(neighborKey)) return;

        const neighborCell = this.knownMap.get(neighborKey);
        if (!neighborCell || !neighborCell.known || !neighborCell.passable)
          return;

        visited.add(neighborKey);
        const newCost = cost + neighborCell.cost;
        queue.push({ point: neighbor, cost: newCost });
      });
    }
  }

  public getBestDirection(ant: any): HexPoint | null {
    const currentPos = { q: ant.q, r: ant.r };
    let bestDirection: HexPoint | null = null;
    let bestScore = Infinity;

    this.getNeighborOffsets().forEach(([dq, dr]) => {
      const neighbor = { q: currentPos.q + dq, r: currentPos.r + dr };
      const neighborKey = this.pointToKey(neighbor);
      const neighborCell = this.knownMap.get(neighborKey);

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
