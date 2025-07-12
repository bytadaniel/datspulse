import { HexNavigator } from "./dijkstra-hex-navigator";

function runNavigationTests() {
  console.log("===== Запуск тестов навигатора =====");

  // Тест 1: Базовый путь без препятствий
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

    const ant = {
      id: "ant1",
      q: 3,
      r: 0,
      type: 0,
      health: 100,
      food: { type: 0, amount: 0 },
    };

    const direction = navigator.getBestDirection(ant);
    const distance = navigator.getDistance({ q: 3, r: 0 });

    console.assert(
      direction?.q === -1 && direction?.r === 0,
      `Ошибка: Ожидалось (-1, 0), получено (${direction?.q}, ${direction?.r})`
    );
    console.assert(
      distance === 3,
      `Ошибка: Ожидалось расстояние 3, получено ${distance}`
    );

    console.log("Результат:", direction, "Расстояние:", distance);
    console.log("----------------------------------");
  }

  // Тест 2: Обход горы (исправленный)
  function testMountainBlock() {
    console.log("Тест 2: Обход горы");
    const houses = [{ q: 0, r: 0 }];
    const map = [
      { q: 0, r: 0, cost: 0, type: 1 }, // Дом
      { q: 1, r: 0, cost: 1, type: 5 }, // Гора (непроходима)
      { q: 1, r: -1, cost: 2, type: 3 }, // Грязь
      { q: 0, r: -1, cost: 1, type: 2 }, // Путь в обход горы
      { q: 0, r: 1, cost: 1, type: 2 }, // Альтернативный путь
      { q: -1, r: 0, cost: 1, type: 2 }, // Альтернативный путь
      { q: 2, r: -1, cost: 1, type: 2 }, // Клетка для обхода
      { q: 2, r: 0, cost: 1, type: 2 }, // Позиция муравья
    ];

    const navigator = new HexNavigator(houses);
    navigator.updateMap(map);

    const ant = {
      id: "ant2",
      q: 2,
      r: 0,
      type: 0,
      health: 100,
      food: { type: 0, amount: 0 },
    };

    const direction = navigator.getBestDirection(ant);
    const distance = navigator.getDistance({ q: 2, r: 0 });

    // Правильный путь: через (2,-1) -> (1,-1) -> (0,-1) -> (0,0)
    // Стоимость: 1 + 2 + 1 = 4
    console.assert(
      direction?.q === 0 && direction?.r === -1,
      `Ошибка: Ожидалось (0, -1), получено (${direction?.q}, ${direction?.r})`
    );
    console.assert(
      distance === 4,
      `Ошибка: Ожидалось расстояние 4, получено ${distance}`
    );

    console.log("Результат:", direction, "Расстояние:", distance);
    console.log("----------------------------------");
  }

  // Тест 3: Избегание кислоты при низком здоровье
  function testAcidAvoidance() {
    console.log("Тест 3: Избегание кислоты при низком здоровье");
    const houses = [{ q: 0, r: 0 }];
    const map = [
      { q: 0, r: 0, cost: 0, type: 1 },
      { q: 1, r: 0, cost: 1, type: 2 },
      { q: 2, r: 0, cost: 1, type: 6 }, // Кислота
      { q: 1, r: 1, cost: 2, type: 3 },
      { q: 2, r: 1, cost: 1, type: 2 },
      { q: 3, r: 1, cost: 1, type: 2 },
    ];

    const navigator = new HexNavigator(houses);
    navigator.updateMap(map);

    // Муравей с низким здоровьем
    const weakAnt = {
      id: "weakAnt",
      q: 2,
      r: 1,
      type: 0,
      health: 5,
      food: { type: 0, amount: 0 },
    };

    const direction = navigator.getBestDirection(weakAnt);
    const distance = navigator.getDistance({ q: 2, r: 1 });

    // Должен выбрать путь назад, а не на кислоту
    console.assert(
      direction?.q === -1 && direction?.r === 0,
      `Ошибка: Ожидалось (-1, 0), получено (${direction?.q}, ${direction?.r})`
    );

    console.log("Результат для слабого муравья:", direction);
    console.log("----------------------------------");
  }

  // Тест 4: Выбор оптимального пути по стоимости
  function testOptimalPathByCost() {
    console.log("Тест 4: Выбор оптимального пути по стоимости");
    const houses = [{ q: 0, r: 0 }];
    const map = [
      { q: 0, r: 0, cost: 0, type: 1 },
      { q: 1, r: 0, cost: 1, type: 2 },
      { q: 2, r: 0, cost: 1, type: 2 },
      { q: 3, r: 0, cost: 1, type: 2 },
      { q: 0, r: 1, cost: 3, type: 3 }, // Более дорогой путь
      { q: 0, r: 2, cost: 3, type: 3 }, // Более дорогой путь
      { q: -1, r: 0, cost: 5, type: 4 }, // Очень дорогой путь
    ];

    const navigator = new HexNavigator(houses);
    navigator.updateMap(map);

    const ant = {
      id: "ant4",
      q: 3,
      r: 0,
      type: 0,
      health: 100,
      food: { type: 0, amount: 0 },
    };

    const direction = navigator.getBestDirection(ant);
    const distance = navigator.getDistance({ q: 3, r: 0 });

    console.assert(
      direction?.q === -1 && direction?.r === 0,
      `Ошибка: Ожидалось (-1, 0), получено (${direction?.q}, ${direction?.r})`
    );
    console.assert(
      distance === 3,
      `Ошибка: Ожидалось расстояние 3, получено ${distance}`
    );

    console.log("Результат:", direction, "Стоимость пути:", distance);
    console.log("----------------------------------");
  }

  // Тест 5: Муравей уже дома
  function testAlreadyHome() {
    console.log("Тест 5: Муравей уже дома");
    const houses = [{ q: 0, r: 0 }];
    const map = [{ q: 0, r: 0, cost: 0, type: 1 }];

    const navigator = new HexNavigator(houses);
    navigator.updateMap(map);

    const ant = {
      id: "ant6",
      q: 0,
      r: 0,
      type: 0,
      health: 100,
      food: { type: 0, amount: 0 },
    };

    const direction = navigator.getBestDirection(ant);
    const distance = navigator.getDistance({ q: 0, r: 0 });

    console.assert(
      direction === null,
      `Ошибка: Ожидалось null, получено (${direction?.q}, ${direction?.r})`
    );
    console.assert(
      distance === 0,
      `Ошибка: Ожидалось расстояние 0, получено ${distance}`
    );

    console.log("Результат:", direction, "Расстояние:", distance);
    console.log("----------------------------------");
  }

  testBasicPath();
  testMountainBlock();
  testAcidAvoidance();
  testOptimalPathByCost();
  testAlreadyHome();

  console.log("===== Тестирование завершено =====");
}

runNavigationTests();
