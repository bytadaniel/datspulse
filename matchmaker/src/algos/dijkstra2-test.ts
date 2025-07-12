import { Ant, PlayerEnemy } from "../api/dto/player-response";
import { HexNavigator } from "./dijkstra2-hex-navigator";

function runNavigationTests() {
  console.log("===== Запуск тестов навигатора =====");

  // Тест 1: Базовый путь без препятствий (остаётся без изменений)
  function testBasicPath() {
    console.log("Тест 1: Базовый путь без препятствий");
    const houses = [{ q: 0, r: 0 }];
    const map = [
      { q: 0, r: 0, cost: 0, type: 1 },
      { q: 1, r: 0, cost: 1, type: 2 },
      { q: 2, r: 0, cost: 1, type: 2 },
      { q: 3, r: 0, cost: 1, type: 2 },
    ];

    const navigator = new HexNavigator(houses);
    navigator.updateMap(map);
    navigator.updateUnits([]);

    const ant = {
      id: "ant1",
      q: 3,
      r: 0,
      type: 0,
      health: 100,
      food: { type: 0, amount: 0 },
    } as Ant;

    const direction = navigator.getBestDirection(ant);
    const distance = navigator.getDistance({ q: 3, r: 0 });
    const path = navigator.getHomeFrom({ q: 3, r: 0 }, ant.type);

    console.assert(
      direction?.q === -1 && direction?.r === 0,
      `Ошибка направления: Ожидалось (-1, 0), получено (${direction?.q}, ${direction?.r})`
    );
    console.assert(
      distance === 3,
      `Ошибка расстояния: Ожидалось 3, получено ${distance}`
    );
    console.assert(
      JSON.stringify(path) ===
        JSON.stringify([
          { q: 3, r: 0 },
          { q: 2, r: 0 },
          { q: 1, r: 0 },
          { q: 0, r: 0 },
        ]),
      `Ошибка маршрута: Ожидалось прямой путь, получено ${JSON.stringify(path)}`
    );

    console.log(
      "Результат:",
      direction,
      "Расстояние:",
      distance,
      "Путь:",
      path
    );
    console.log("----------------------------------");
  }

  // Тест 2: Обход горы (исправленные ожидания)
  function testMountainBlock() {
    console.log("Тест 2: Обход горы");
    const houses = [{ q: 0, r: 0 }];
    const map = [
      { q: 0, r: 0, cost: 0, type: 1 },
      { q: 1, r: 0, cost: 1, type: 5 },
      { q: 1, r: -1, cost: 2, type: 3 },
      { q: 0, r: -1, cost: 1, type: 2 },
      { q: 2, r: -1, cost: 1, type: 2 },
      { q: 2, r: 0, cost: 1, type: 2 },
    ];

    const navigator = new HexNavigator(houses);
    navigator.updateMap(map);
    navigator.updateUnits([]);

    const ant = {
      id: "ant2",
      q: 2,
      r: 0,
      type: 0,
      health: 100,
      food: { type: 0, amount: 0 },
    } as Ant;

    const direction = navigator.getBestDirection(ant);
    const distance = navigator.getDistance({ q: 2, r: 0 });
    const path = navigator.getHomeFrom({ q: 2, r: 0 }, ant.type);

    console.assert(
      direction?.q === 0 && direction?.r === -1,
      `Ошибка направления: Ожидалось (0, -1), получено (${direction?.q}, ${direction?.r})`
    );
    console.assert(
      distance === 4,
      `Ошибка расстояния: Ожидалось 4, получено ${distance}`
    );
    console.assert(
      JSON.stringify(path) ===
        JSON.stringify([
          { q: 2, r: 0 },
          { q: 2, r: -1 },
          { q: 1, r: -1 },
          { q: 0, r: -1 },
          { q: 0, r: 0 },
        ]),
      `Ошибка маршрута: Ожидался обходной путь, получено ${JSON.stringify(
        path
      )}`
    );

    console.log(
      "Результат:",
      direction,
      "Расстояние:",
      distance,
      "Путь:",
      path
    );
    console.log("----------------------------------");
  }

  // Тест 3: Избегание кислоты при низком здоровье (исправленные ожидания)
  function testAcidAvoidance() {
    console.log("Тест 3: Избегание кислоты при низком здоровье");
    const houses = [{ q: 0, r: 0 }];
    const map = [
      { q: 0, r: 0, cost: 0, type: 1 },
      { q: 1, r: 0, cost: 1, type: 2 },
      { q: 2, r: 0, cost: 1, type: 6 },
      { q: 1, r: 1, cost: 2, type: 3 },
      { q: 2, r: 1, cost: 1, type: 2 },
    ];

    const navigator = new HexNavigator(houses);
    navigator.updateMap(map);
    navigator.updateUnits([]);

    const weakAnt = {
      id: "weakAnt",
      q: 2,
      r: 1,
      type: 0,
      health: 5,
      food: { type: 0, amount: 0 },
    } as Ant;

    const direction = navigator.getBestDirection(weakAnt);
    const path = navigator.getHomeFrom({ q: 2, r: 1 }, weakAnt.type);

    console.assert(
      direction?.q === -1 && direction?.r === 0,
      `Ошибка направления: Ожидалось (-1, 0), получено (${direction?.q}, ${direction?.r})`
    );
    console.assert(
      JSON.stringify(path) ===
        JSON.stringify([
          { q: 2, r: 1 },
          { q: 1, r: 1 },
          { q: 1, r: 0 },
          { q: 0, r: 0 },
        ]),
      `Ошибка маршрута: Ожидался безопасный путь, получено ${JSON.stringify(
        path
      )}`
    );

    console.log("Результат для слабого муравья:", direction, "Путь:", path);
    console.log("----------------------------------");
  }

  // Тест 4: Обход клеток с юнитами того же типа (исправленные ожидания)
  function testUnitAvoidance() {
    console.log("Тест 4: Обход клеток с юнитами того же типа");
    const houses = [{ q: 0, r: 0 }];
    const map = [
      { q: 0, r: 0, cost: 0, type: 1 },
      { q: 1, r: 0, cost: 1, type: 2 },
      { q: 2, r: 0, cost: 1, type: 2 },
      { q: 3, r: 0, cost: 1, type: 2 },
      { q: 1, r: 1, cost: 1, type: 2 },
      { q: 2, r: 1, cost: 1, type: 2 },
      { q: 3, r: 1, cost: 1, type: 2 },
    ];

    const navigator = new HexNavigator(houses);
    navigator.updateMap(map);

    const units = [
      { q: 2, r: 0, type: 0 },
      { q: 3, r: 1, type: 1 },
    ] as (Ant | PlayerEnemy)[];
    navigator.updateUnits(units);

    const ant = {
      id: "ant4",
      q: 3,
      r: 0,
      type: 0,
      health: 100,
      food: { type: 0, amount: 0 },
    } as Ant;

    const direction = navigator.getBestDirection(ant);
    const path = navigator.getHomeFrom({ q: 3, r: 0 }, ant.type);

    console.assert(
      direction?.q === 0 && direction?.r === 1,
      `Ошибка направления: Ожидалось (0, 1), получено (${direction?.q}, ${direction?.r})`
    );
    console.assert(
      JSON.stringify(path) ===
        JSON.stringify([
          { q: 3, r: 0 },
          { q: 3, r: 1 },
          { q: 2, r: 1 },
          { q: 1, r: 1 },
          { q: 1, r: 0 },
          { q: 0, r: 0 },
        ]),
      `Ошибка маршрута: Ожидался обходной путь, получено ${JSON.stringify(
        path
      )}`
    );

    console.log("Результат:", direction, "Путь:", path);
    console.log("----------------------------------");
  }

  // Тест 5: Тупиковая ситуация (нет пути)
  function testNoPath() {
    console.log("Тест 5: Тупиковая ситуация");
    const houses = [{ q: 0, r: 0 }];
    const map = [
      { q: 0, r: 0, cost: 0, type: 1 },
      { q: 1, r: 0, cost: 1, type: 5 }, // Гора
      { q: 0, r: 1, cost: 1, type: 5 }, // Гора
      { q: -1, r: 1, cost: 1, type: 5 }, // Гора
      { q: -1, r: 0, cost: 1, type: 5 }, // Гора
      { q: 0, r: -1, cost: 1, type: 5 }, // Гора
      { q: 1, r: -1, cost: 1, type: 5 }, // Гора
    ];

    const navigator = new HexNavigator(houses);
    navigator.updateMap(map);
    navigator.updateUnits([]);

    const ant = {
      id: "ant5",
      q: 0,
      r: 0,
      type: 0,
      health: 100,
      food: { type: 0, amount: 0 },
    } as Ant;

    // Проверка направления (должен вернуть null)
    const direction = navigator.getBestDirection(ant);
    console.assert(
      direction === null,
      `Ошибка направления: Ожидалось null, получено (${direction?.q}, ${direction?.r})`
    );

    // Проверка маршрута (должен вернуть только текущую позицию)
    const path = navigator.getHomeFrom({ q: 0, r: 0 }, ant.type);
    const expectedPath = [{ q: 0, r: 0 }];
    console.assert(
      JSON.stringify(path) === JSON.stringify(expectedPath),
      `Ошибка маршрута: Ожидалось ${JSON.stringify(
        expectedPath
      )}, получено ${JSON.stringify(path)}`
    );

    console.log("Результат:", direction, "Путь:", path);
    console.log("----------------------------------");
  }

  // Тест 6: Муравей уже дома
  function testAlreadyHome() {
    console.log("Тест 6: Муравей уже дома");
    const houses = [{ q: 0, r: 0 }];
    const map = [{ q: 0, r: 0, cost: 0, type: 1 }];

    const navigator = new HexNavigator(houses);
    navigator.updateMap(map);
    navigator.updateUnits([]);

    const ant = {
      id: "ant6",
      q: 0,
      r: 0,
      type: 0,
      health: 100,
      food: { type: 0, amount: 0 },
    } as Ant;

    // Проверка направления
    const direction = navigator.getBestDirection(ant);
    console.assert(
      direction === null,
      `Ошибка направления: Ожидалось null, получено (${direction?.q}, ${direction?.r})`
    );

    // Проверка расстояния
    const distance = navigator.getDistance({ q: 0, r: 0 });
    console.assert(
      distance === 0,
      `Ошибка расстояния: Ожидалось 0, получено ${distance}`
    );

    // Проверка маршрута
    const path = navigator.getHomeFrom({ q: 0, r: 0 }, ant.type);
    const expectedPath = [{ q: 0, r: 0 }];
    console.assert(
      JSON.stringify(path) === JSON.stringify(expectedPath),
      `Ошибка маршрута: Ожидалось ${JSON.stringify(
        expectedPath
      )}, получено ${JSON.stringify(path)}`
    );

    console.log(
      "Результат:",
      direction,
      "Расстояние:",
      distance,
      "Путь:",
      path
    );
    console.log("----------------------------------");
  }

  // Тест 7: Путь через клетку с чужаком
  function testEnemyOnPath() {
    console.log("Тест 7: Путь через клетку с чужаком");
    const houses = [{ q: 0, r: 0 }];
    const map = [
      { q: 0, r: 0, cost: 0, type: 1 },
      { q: 1, r: 0, cost: 1, type: 2 },
      { q: 2, r: 0, cost: 1, type: 2 },
    ];

    const navigator = new HexNavigator(houses);
    navigator.updateMap(map);

    // Добавляем вражеского юнита на пути
    const units = [
      { q: 1, r: 0, type: 1 }, // Чужой юнит
    ] as (Ant | PlayerEnemy)[];
    navigator.updateUnits(units);

    const ant = {
      id: "ant7",
      q: 2,
      r: 0,
      type: 0,
      health: 100,
      food: { type: 0, amount: 0 },
    } as Ant;

    // Проверка направления (должен пройти через чужого)
    const direction = navigator.getBestDirection(ant);
    console.assert(
      direction?.q === -1 && direction?.r === 0,
      `Ошибка направления: Ожидалось (-1, 0), получено (${direction?.q}, ${direction?.r})`
    );

    // Проверка маршрута (должен включать клетку с врагом)
    const path = navigator.getHomeFrom({ q: 2, r: 0 }, ant.type);
    const expectedPath = [
      { q: 2, r: 0 },
      { q: 1, r: 0 },
      { q: 0, r: 0 },
    ];
    console.assert(
      JSON.stringify(path) === JSON.stringify(expectedPath),
      `Ошибка маршрута: Ожидалось ${JSON.stringify(
        expectedPath
      )}, получено ${JSON.stringify(path)}`
    );

    console.log("Результат:", direction, "Путь:", path);
    console.log("----------------------------------");
  }

  // Запуск всех тестов
  testBasicPath();
  testMountainBlock();
  testAcidAvoidance();
  testUnitAvoidance();
  testNoPath();
  testAlreadyHome();
  testEnemyOnPath();

  console.log("===== Тестирование завершено =====");
}

runNavigationTests();
