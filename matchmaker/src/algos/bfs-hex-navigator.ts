import { readFileSync } from "fs";
import { resolve } from "path";

type HexPoint = { q: number; r: number };
type Cell = { known: boolean; passable: boolean; distance?: number };

export class HexNavigator {
  private knownMap: Map<string, Cell>;
  private houses: HexPoint[];
  private pendingUpdates: HexPoint[];

  constructor(houses: HexPoint[]) {
    this.knownMap = new Map();
    this.houses = houses;
    this.pendingUpdates = [];

    // Инициализация домов
    houses.forEach((house) => {
      const key = this.pointToKey(house);
      this.knownMap.set(key, { known: true, passable: true, distance: 0 });
    });
  }

  // Инициализация начальной карты
  public initializeMap(
    mapData: { q: number; r: number; type: number }[]
  ): void {
    mapData.forEach((cell) => {
      const key = this.pointToKey(cell);
      // Типы 1, 2, 3 считаем проходимыми, тип 5 - непроходимый
      const passable = cell.type !== 5;
      this.knownMap.set(key, {
        known: true,
        passable,
        distance: undefined,
      });
      this.pendingUpdates.push(cell);
    });

    this.calculateDistances();
  }

  // Обновление видимости из текущей позиции
  public updateVisibility(
    center: HexPoint,
    visionRadius: number,
    newCells: Map<string, boolean>
  ): void {
    const revealedPoints: HexPoint[] = [];
    const cubeCenter = this.axialToCube(center);

    // Обходим все клетки в области видимости
    for (let dx = -visionRadius; dx <= visionRadius; dx++) {
      for (
        let dy = Math.max(-visionRadius, -dx - visionRadius);
        dy <= Math.min(visionRadius, -dx + visionRadius);
        dy++
      ) {
        const dz = -dx - dy;
        const cube = {
          x: cubeCenter.x + dx,
          y: cubeCenter.y + dy,
          z: cubeCenter.z + dz,
        };
        const point = this.cubeToAxial(cube);
        const key = this.pointToKey(point);

        if (!this.knownMap.has(key)) {
          // Получаем информацию о проходимости из переданных данных
          const passable = newCells.get(key) ?? false;
          this.knownMap.set(key, {
            known: true,
            passable,
            distance: undefined,
          });
          revealedPoints.push(point);
        }
      }
    }

    if (revealedPoints.length > 0) {
      this.pendingUpdates.push(...revealedPoints);
      this.calculateDistances();
    }
  }

  // Получение расстояния до ближайшего дома
  public getDistance(point: HexPoint): number | undefined {
    const key = this.pointToKey(point);
    return this.knownMap.get(key)?.distance;
  }

  // Получение лучшего направления движения
  public getBestDirection(pos: HexPoint): HexPoint | null {
    const offsets = this.getNeighborOffsets();
    let minDist = Infinity;
    let bestDir: HexPoint | null = null;

    for (const [dq, dr] of offsets) {
      const neighbor = { q: pos.q + dq, r: pos.r + dr };
      const dist = this.getDistance(neighbor);

      if (dist !== undefined && dist < minDist) {
        minDist = dist;
        bestDir = { q: dq, r: dr };
      }
    }

    return bestDir;
  }

  // Пересчет расстояний с использованием BFS
  private calculateDistances(): void {
    const queue: HexPoint[] = [];
    const visited = new Set<string>();
    
    // Добавляем ВСЕ проходимые точки из pendingUpdates
    const toProcess = [...this.pendingUpdates];
    this.pendingUpdates = [];
    
    // Добавляем дома в обработку
    this.houses.forEach(house => {
        toProcess.push(house);
    });

    // Инициализация очереди
    toProcess.forEach(point => {
        const key = this.pointToKey(point);
        const cell = this.knownMap.get(key);
        
        if (cell && cell.known && cell.passable) {
            // Сбрасываем расстояние для пересчета
            cell.distance = undefined;
            
            // Если это дом - устанавливаем расстояние 0
            if (this.houses.some(h => h.q === point.q && h.r === point.r)) {
                cell.distance = 0;
                queue.push(point);
                visited.add(key);
            }
        }
    });

    // Обработка очереди
    while (queue.length > 0) {
        const current = queue.shift()!;
        const currentKey = this.pointToKey(current);
        const currentCell = this.knownMap.get(currentKey)!;
        const currentDist = currentCell.distance ?? Infinity;
        
        const offsets = this.getNeighborOffsets();
        for (const [dq, dr] of offsets) {
            const neighbor: HexPoint = { 
                q: current.q + dq, 
                r: current.r + dr 
            };
            const neighborKey = this.pointToKey(neighbor);
            
            // Пропускаем непосещенные или непроходимые
            if (visited.has(neighborKey)) continue;
            
            const neighborCell = this.knownMap.get(neighborKey);
            if (!neighborCell || !neighborCell.known || !neighborCell.passable) continue;
            
            // Обновляем расстояние
            const newDist = currentDist + 1;
            if (neighborCell.distance === undefined || newDist < neighborCell.distance) {
                neighborCell.distance = newDist;
                visited.add(neighborKey);
                queue.push(neighbor);
            }
        }
    }
}

  // Вспомогательные методы
  public pointToKey(point: HexPoint): string {
    return `${point.q},${point.r}`;
  }

  private getNeighborOffsets(): [number, number][] {
    return [
      [0, -1],
      [1, -1],
      [1, 0],
      [0, 1],
      [-1, 1],
      [-1, 0],
    ];
  }

  public axialToCube(point: HexPoint): { x: number; y: number; z: number } {
    const x = point.q;
    const z = point.r;
    const y = -x - z;
    return { x, y, z };
  }

  public cubeToAxial(cube: { x: number; y: number; z: number }): HexPoint {
    return { q: cube.x, r: cube.z };
  }
}

// Пример использования с вашими данными
function exampleUsage(data: any) {
  // 1. Извлекаем дома и начальную карту из данных
  const houses = data.home;
  const initialMap = data.map;

  // 2. Создаем навигатор
  const navigator = new HexNavigator(houses);

  // 3. Инициализируем начальную карту
  navigator.initializeMap(initialMap);

  // 4. Для каждого муравья получаем направление к дому
  data.ants.forEach((ant: any) => {
    const antPos = { q: ant.q, r: ant.r };

    // 5. Определяем область видимости (радиус зависит от типа муравья)
    const visionRadius = ant.type === 0 ? 3 : 2; // Пример

    // 6. Собираем информацию о новых клетках (в реальной игре нужно определить проходимость)
    const newCells = new Map<string, boolean>();

    // 7. Обновляем видимость
    navigator.updateVisibility(antPos, visionRadius, newCells);

    // 8. Получаем направление движения к дому
    const direction = navigator.getBestDirection(antPos);
    console.log(`Муравей ${ant.id}:`, direction);

    // 9. Получаем расстояние
    const distance = navigator.getDistance(antPos);
    console.log(`Расстояние до дома:`, distance);
  });
}

// Загрузка данных и запуск
// В реальном коде данные будут приходить от сервера
const data = JSON.parse(
  readFileSync(
    resolve(__dirname, "../../../visualizer/arena_response.json")
  ).toString("utf-8")
);

exampleUsage(data);
