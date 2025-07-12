import { Ant, FoodOnMap, Hex, PlayerResponse, Tile } from "../api/dto/player-response";
import { HexNavigator } from "./bfs-hex-navigator";

// Генератор тестовых данных
function generateTestData(): PlayerResponse {
  // Создаем дом в виде кластера из 7 гексов
  const homeCenter = { q: 0, r: 0 };
  const home: Hex[] = [
    homeCenter,
    { q: 1, r: 0 },
    { q: -1, r: 0 },
    { q: 0, r: 1 },
    { q: 0, r: -1 },
    { q: 1, r: -1 },
    { q: -1, r: 1 }
  ];

  // Генератор карты с гарантированной связностью
  const map: Tile[] = [];
  const mapRadius = 20;
  const houseKeys = new Set(home.map(h => `${h.q},${h.r}`));
  
  // Сначала создаем полностью проходимую карту
  for (let q = -mapRadius; q <= mapRadius; q++) {
      for (let r = Math.max(-mapRadius, -q - mapRadius); r <= Math.min(mapRadius, -q + mapRadius); r++) {
          const isHome = houseKeys.has(`${q},${r}`);
          map.push({
              q,
              r,
              cost: 1,
              type: isHome ? 1 : 2 // Дом - камень, остальное - трава
          });
      }
  }
  
  // Добавляем немного препятствий, но гарантируем связность
  const obstacles = [
      {q: 3, r: 0}, {q: -3, r: 3}, {q: 5, r: -2},
      {q: -10, r: 5}, {q: 7, r: 7}, {q: -6, r: -6}
  ];
  
  obstacles.forEach(pos => {
      const tile = map.find(t => t.q === pos.q && t.r === pos.r);
      if (tile) tile.type = 5; // Горы
  });

  // Муравьи ВНЕ препятствий
  const ants = [
      {id: 'ant1', q: 5, r: 5, type: 0, health: 100, food: {type: 0, amount: 0}},
      {id: 'ant2', q: -8, r: 3, type: 1, health: 150, food: {type: 0, amount: 0}},
      {id: 'ant3', q: 10, r: -2, type: 2, health: 80, food: {type: 0, amount: 0}},
      {id: 'ant4', q: -5, r: -5, type: 0, health: 100, food: {type: 0, amount: 0}}
  ] as Ant[];

  // Создаем еду
  const food: FoodOnMap[] = [
    { q: 3, r: 4, type: 1, amount: 5 },
    { q: -5, r: 2, type: 1, amount: 3 },
    { q: 8, r: -7, type: 2, amount: 10 },
    { q: -10, r: 8, type: 2, amount: 7 }
  ];

  return {
    ants,
    enemies: [],
    food,
    home,
    map,
    nextTurnIn: 5.0,
    score: 42,
    spot: homeCenter,
    turnNo: 10
  };
}

function runNavigationTest() {
  const testData = generateTestData();
  const navigator = new HexNavigator(testData.home);
  navigator.initializeMap(testData.map);
  
  // Проверка связности карты
  const unreachablePoints: Hex[] = [];
  testData.map.forEach(tile => {
      if (tile.type !== 5) { // Только проходимые
          const dist = navigator.getDistance(tile);
          if (dist === undefined) {
              unreachablePoints.push(tile);
          }
      }
  });
  
  console.log(`Недоступные точки: ${unreachablePoints.length}`);
  if (unreachablePoints.length > 0) {
      console.log('Пример:', unreachablePoints[0]);
  }
  
  // Тестирование муравьев
  testData.ants.forEach(ant => {
      const pos = {q: ant.q, r: ant.r};
      const visionRadius = ant.type === 0 ? 5 : 3;
      
      // Собираем информацию о новых клетках
      const newCells = new Map<string, boolean>();
      const cubeCenter = navigator.axialToCube(pos);
      
      for (let dx = -visionRadius; dx <= visionRadius; dx++) {
          for (let dy = Math.max(-visionRadius, -dx-visionRadius); 
               dy <= Math.min(visionRadius, -dx+visionRadius); 
               dy++) {
              const dz = -dx-dy;
              const cube = {
                  x: cubeCenter.x + dx,
                  y: cubeCenter.y + dy,
                  z: cubeCenter.z + dz
              };
              const point = navigator.cubeToAxial(cube);
              const key = navigator.pointToKey(point);
              const tile = testData.map.find(t => t.q === point.q && t.r === point.r);
              
              if (tile) {
                  newCells.set(key, tile.type !== 5);
              }
          }
      }
      
      navigator.updateVisibility(pos, visionRadius, newCells);
      const distance = navigator.getDistance(pos);
      const direction = navigator.getBestDirection(pos);
      
      console.log(`Муравей ${ant.id} в (${pos.q},${pos.r}):`);
      console.log(`- Тип: ${ant.type}, Радиус обзора: ${visionRadius}`);
      console.log(`- Расстояние: ${distance ?? 'недостижимо'}`);
      console.log(`- Направление: ${direction ? `(${direction.q},${direction.r})` : 'дом'}`);
      
      // Проверка направления
      if (distance !== undefined && distance > 0) {
          if (!direction) {
              console.error('ОШИБКА: Должно быть направление!');
          } else {
              const newPos = {q: pos.q + direction.q, r: pos.r + direction.r};
              const newDist = navigator.getDistance(newPos);
              
              if (newDist === undefined || newDist >= distance) {
                  console.error('ОШИБКА: Направление не уменьшает расстояние!');
              }
          }
      }
      console.log('---');
  });
}

function testComplexScenario() {
  // Создаем карту с узким проходом
  const complexMap = [
      {q:0, r:0, type:1}, // дом
      {q:1, r:0, type:1},
      {q:2, r:0, type:2},
      {q:3, r:0, type:2},
      {q:3, r:1, type:5}, // гора
      {q:3, r:-1, type:5}, // гора
      {q:4, r:0, type:2},
      {q:5, r:0, type:2} // муравей здесь
  ];
  
  const navigator = new HexNavigator([{q:0, r:0}]);
  navigator.initializeMap(complexMap);
  
  const antPos = {q:5, r:0};
  const dist = navigator.getDistance(antPos);
  const dir = navigator.getBestDirection(antPos);
  
  console.log(`Сложный сценарий:`);
  console.log(`Позиция: (${antPos.q},${antPos.r})`);
  console.log(`Расстояние: ${dist}`); // Должно быть 5
  console.log(`Направление:`, dir); // Должно быть (-1,0)
}


// Запуск теста
runNavigationTest();
testComplexScenario();