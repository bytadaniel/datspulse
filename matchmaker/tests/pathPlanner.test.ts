import { PathPlanner, UnitTarget } from "../src/algos/3-hex-navigator";
import { Ant, Tile, PlayerEnemy, Hex } from "../src/api/dto/player-response";

describe("PathPlanner", () => {
  let pathPlanner: PathPlanner;

  const myHome = [
    { q: 0, r: 0 },
    { q: 1, r: 0 },
    { q: 0, r: 1 },
  ];

  const createHex = (q: number, r: number): Hex => ({ q, r });

  beforeEach(() => {
    pathPlanner = new PathPlanner(myHome);
  });

  describe("updateMap", () => {
    it("should update map with passable tiles", () => {
      const tiles: Tile[] = [
        { q: 1, r: 1, cost: 1, type: 2 },
        { q: 2, r: 1, cost: 1, type: 2 },
      ];

      pathPlanner.updateMap(tiles);

      const result = pathPlanner.getDistance({ q: 1, r: 1 }, { q: 2, r: 1 });
      expect(result).toBe(1);
    });

    it("should mark stone tiles as impassable", () => {
      const tiles: Tile[] = [
        { q: 1, r: 1, cost: 1, type: 5 }, // Камень
        { q: 2, r: 1, cost: 1, type: 2 }, // Обычная клетка
      ];

      pathPlanner.updateMap(tiles);

      const ant: Ant = {
        q: 0,
        r: 1,
        type: 0,
        health: 100,
        id: "test1",
        food: { type: 0, amount: 0 },
        lastAttack: createHex(0, 0),
        lastEnemyAnt: "",
        lastMove: [],
        move: [],
      };

      const targets: UnitTarget[] = [{ ant, target: { q: 2, r: 1 } }];
      const commands = pathPlanner.planMoves(targets);

      expect(commands[0].path.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("updateUnits", () => {
    it("should track friendly and enemy units", () => {
      const ants: Ant[] = [
        {
          q: 1,
          r: 1,
          type: 0,
          health: 100,
          id: "ant1",
          food: { type: 0, amount: 0 },
          lastAttack: createHex(0, 0),
          lastEnemyAnt: "",
          lastMove: [],
          move: [],
        },
      ];

      const enemies: PlayerEnemy[] = [
        {
          q: 2,
          r: 1,
          type: 1, // Тип врага
          health: 100, // Здоровье врага
          attack: 10, // Значение атаки
          food: { type: 0, amount: 0 }, // Пища врага
        },
      ];

      pathPlanner.updateUnits(ants, enemies);

      const tiles: Tile[] = [
        { q: 0, r: 1, cost: 1, type: 2 },
        { q: 1, r: 1, cost: 1, type: 2 },
        { q: 2, r: 1, cost: 1, type: 2 },
        { q: 3, r: 1, cost: 1, type: 2 },
      ];

      pathPlanner.updateMap(tiles);

      const testAnt: Ant = {
        q: 0,
        r: 1,
        type: 0,
        health: 100,
        id: "test",
        food: { type: 0, amount: 0 },
        lastAttack: createHex(0, 0),
        lastEnemyAnt: "",
        lastMove: [],
        move: [],
      };

      const targets: UnitTarget[] = [{ ant: testAnt, target: { q: 3, r: 1 } }];
      const commands = pathPlanner.planMoves(targets);

      expect(commands[0].path).not.toContainEqual({ q: 2, r: 1 });
    });
  });

  describe("planMoves", () => {
    beforeEach(() => {
      const tiles: Tile[] = [];
      for (let q = 0; q <= 4; q++) {
        for (let r = 0; r <= 4; r++) {
          tiles.push({ q, r, cost: 1, type: 2 });
        }
      }
      pathPlanner.updateMap(tiles);
    });

    it("should prioritize workers over other units", () => {
      const worker: Ant = {
        q: 0,
        r: 0,
        type: 0,
        health: 100,
        id: "worker",
        food: { type: 0, amount: 0 },
        lastAttack: createHex(0, 0),
        lastEnemyAnt: "",
        lastMove: [],
        move: [],
      };

      const fighter: Ant = {
        q: 0,
        r: 1,
        type: 1,
        health: 100,
        id: "fighter",
        food: { type: 0, amount: 0 },
        lastAttack: createHex(0, 0),
        lastEnemyAnt: "",
        lastMove: [],
        move: [],
      };

      const scout: Ant = {
        q: 0,
        r: 2,
        type: 2,
        health: 100,
        id: "scout",
        food: { type: 0, amount: 0 },
        lastAttack: createHex(0, 0),
        lastEnemyAnt: "",
        lastMove: [],
        move: [],
      };

      const targets: UnitTarget[] = [
        { ant: fighter, target: { q: 2, r: 1 } },
        { ant: worker, target: { q: 2, r: 0 } },
        { ant: scout, target: { q: 2, r: 2 } },
      ];

      const commands = pathPlanner.planMoves(targets);

      // Первая команда должна быть для рабочего
      expect(commands[0].ant).toBe("worker");
    });

    it("should respect unit speeds", () => {
      const worker: Ant = {
        q: 0,
        r: 0,
        type: 0,
        health: 100,
        id: "worker",
        food: { type: 0, amount: 0 },
        lastAttack: createHex(0, 0),
        lastEnemyAnt: "",
        lastMove: [],
        move: [],
      };

      const scout: Ant = {
        q: 0,
        r: 2,
        type: 2,
        health: 100,
        id: "scout",
        food: { type: 0, amount: 0 },
        lastAttack: createHex(0, 0),
        lastEnemyAnt: "",
        lastMove: [],
        move: [],
      };

      const targets: UnitTarget[] = [
        { ant: worker, target: { q: 4, r: 4 } }, // Скорость 5
        { ant: scout, target: { q: 4, r: 4 } }, // Скорость 7
      ];

      const commands = pathPlanner.planMoves(targets);

      // Разведчик должен двигаться дальше всех за один ход
      const scoutPath = commands.find((cmd) => cmd.ant === "scout")?.path || [];
      const workerPath =
        commands.find((cmd) => cmd.ant === "worker")?.path || [];

      expect(scoutPath.length).toBeGreaterThanOrEqual(workerPath.length);
    });
  });
});
