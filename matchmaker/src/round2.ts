import { randomInt } from "node:crypto";
import { PathPlanner, UnitTarget } from "./algos/3-hex-navigator";
import { Api } from "./api";
import {
  AntMoveCommand,
  PlayerMoveCommands,
} from "./api/dto/player-move-commands";
import { Ant, Hex, PlayerResponse } from "./api/dto/player-response";
import { PlayerResponseWithErrors } from "./api/dto/player-response-with-errors";
import { register } from "./api/methods/register";
import { AutoMoveClass } from "./feature/move";

enum AntType {
  Worker, // 0
  Warrior, // 1
  Scout, // 2
}

const EXPLORATION_DIRECTIONS = [
  { q: 2, r: 0 },
  { q: 2, r: -2 },
  { q: 0, r: -2 },
  { q: -2, r: 0 },
  { q: -2, r: 2 },
  { q: 0, r: 2 },
  { q: 1, r: -1 },
  { q: -1, r: -1 },
];

let _navigator: PathPlanner;

function getNavigator(state: PlayerResponse): PathPlanner {
  if (!_navigator) {
    _navigator = new PathPlanner(state.home);
    _navigator.updateMap(state.map);
  }
  _navigator.updateUnits(state.ants, state.enemies);
  return _navigator;
}

const api = new Api();
const antHome = new Map<string, Hex>();
const workerGuardians = new Map<string, string>(); // worker.id -> warrior.id
const warriorAssignments = new Map<string, string>(); // warrior.id -> worker.id

// Функция для обновления привязок военных к рабочим
function updateWorkerGuardianAssignments(
  workers: Ant[],
  warriors: Ant[]
): void {
  // Создаем индексы для быстрого поиска
  const workerIndex = new Map(workers.map((w) => [w.id, w]));
  const warriorIndex = new Map(warriors.map((w) => [w.id, w]));

  // Очищаем мертвые привязки
  for (const [workerId, warriorId] of workerGuardians.entries()) {
    if (!workerIndex.has(workerId) || !warriorIndex.has(warriorId)) {
      workerGuardians.delete(workerId);
      warriorAssignments.delete(warriorId);
    }
  }

  // Находим свободных военных
  const freeWarriors = warriors.filter((w) => !warriorAssignments.has(w.id));

  // Находим рабочих без охраны
  const unguardedWorkers = workers.filter((w) => !workerGuardians.has(w.id));

  // Назначаем свободных военных незащищенным рабочим
  let warriorIndex2 = 0;
  for (const worker of unguardedWorkers) {
    if (warriorIndex2 < freeWarriors.length) {
      const warrior = freeWarriors[warriorIndex2];
      workerGuardians.set(worker.id, warrior.id);
      warriorAssignments.set(warrior.id, worker.id);
      warriorIndex2++;
    }
  }

  console.log(
    `Guardian assignments: ${workerGuardians.size} workers protected, ${
      unguardedWorkers.length - warriorIndex2
    } unprotected`
  );
}

// Функция для получения позиции охраны рядом с рабочим
function getGuardPosition(
  worker: Ant,
  warrior: Ant,
  navigator: PathPlanner
): Hex {
  // Если военный уже рядом с рабочим (расстояние 1), остаемся на месте
  const distance = navigator.getDistance(warrior, worker);
  if (distance <= 1) {
    return { q: warrior.q, r: warrior.r };
  }

  // Иначе движемся к рабочему
  return { q: worker.q, r: worker.r };
}

function onGameTurn(state: PlayerResponse): AntMoveCommand[] {
  updateAntHomeIndex(state);
  const scoutAutoMove = new AutoMoveClass();
  const antCommands: AntMoveCommand[] = [];
  const navigator = getNavigator(state);

  const iAnts = state.ants.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {} as Record<string, Ant>);

  const antTargets: UnitTarget[] = [];
  const _scouts = state.ants.filter((ant) => ant.type === AntType.Scout);
  const workers = state.ants.filter((ant) => ant.type === AntType.Worker);
  const warriors = state.ants.filter((ant) => ant.type === AntType.Warrior);
  const foodWalkers = state.ants.filter((ant) => ant.food.amount);

  // Обновляем привязки военных к рабочим
  updateWorkerGuardianAssignments(workers, warriors);

  console.log(`
----Score=${state.score}----
----Food=${state.food.length}----
Scouts=${_scouts.length}
Workers=${workers.length}
Warriors=${warriors.length}
FoodWalkers=${foodWalkers.length}
Protected Workers=${workerGuardians.size}
  `);

  // Планируем движение рабочих
  let food = [...state.food];
  for (const ant of workers) {
    if (ant.food.amount) {
      antTargets.push({
        ant,
        target: antHome.get(ant.id)!,
      });
    } else {
      if (food.length > 0) {
        let [cFood] = food.sort(
          (a, b) =>
            navigator.getDistance(ant, a) - navigator.getDistance(ant, b)
        );
        if (!cFood) {
          cFood = state.food[0];
        }
        food = food.filter((c) => !(c.q === cFood?.q && c.r === cFood?.r));
        antTargets.push({
          ant,
          target: cFood,
        });
      }
    }
  }

  // Планируем движение военных-охранников
  const assignedWarriors: Ant[] = [];
  const unassignedWarriors: Ant[] = [];

  for (const warrior of warriors) {
    const workerId = warriorAssignments.get(warrior.id);
    if (workerId) {
      const worker = iAnts[workerId];
      if (worker) {
        assignedWarriors.push(warrior);
        const guardPosition = getGuardPosition(worker, warrior, navigator);
        antTargets.push({
          ant: warrior,
          target: guardPosition,
        });
      }
    } else {
      unassignedWarriors.push(warrior);
    }
  }

  // Движение рабочих и назначенных военных
  const workerMovement = navigator.planMoves(antTargets).map((amc) => {
    amc.path = amc.path.filter(
      (c) => !(c.q === iAnts[amc.ant].q && c.r === iAnts[amc.ant].r)
    );
    return amc;
  });

  // Неназначенные военные исследуют как скауты
  const scouts = [..._scouts, ...unassignedWarriors];
  const scoutMovement = scoutAutoMove.runAutoMove(scouts);

  antCommands.push(...workerMovement, ...scoutMovement);

  return antCommands;
}

function updateAntHomeIndex(state: PlayerResponse): typeof antHome {
  const index = state.ants.reduce((acc, ant) => {
    acc[ant.id] = ant;
    return acc;
  }, {} as Record<string, Ant>);

  for (const ant of state.ants) {
    for (const id of antHome.keys()) {
      if (!index[id]) {
        antHome.delete(id);
      }
    }
    if (ant.type !== AntType.Worker) {
      continue;
    }
    for (const ant of state.ants) {
      if (!antHome.has(ant.id)) {
        antHome.set(
          ant.id,
          state.home.filter(
            (c) => !(c.q == state.spot.q && c.r === state.spot.r)
          )[randomInt(state.home.length - 1)]
        );
      }
    }
  }
  return antHome;
}

function resetAntHomes(): void {
  antHome.clear();
  workerGuardians.clear();
  warriorAssignments.clear();
}

(async function () {
  let state: PlayerResponse | PlayerResponseWithErrors =
    undefined as unknown as any;

  setInterval(async () => {
    const newState = await api.refresh();
    if (newState) {
      console.log("RefreshState");
      state = newState;
    }
  }, 1000);

  setInterval(async () => {
    const registered = await register();
    console.log({ registered });
  }, 15_000);

  const turns = new Set();

  while (true) {
    if (!state?.home.length) {
      console.log(Date.now(), "Pending....");
      resetAntHomes();
      turns.clear();
      await new Promise((resolve) => setTimeout(resolve, 500));
      continue;
    }

    const timeLeft = state.nextTurnIn * 1000;
    console.log(`\nTurn=${state.turnNo} Left=${timeLeft}`);

    if (timeLeft < 0) {
      await new Promise((resolve) => setTimeout(resolve, 2000 + timeLeft));
      continue;
    }

    if (turns.has(state.turnNo)) {
      await new Promise((resolve) => setTimeout(resolve, timeLeft));
      continue;
    } else {
      turns.add(state.turnNo);
    }

    const t1 = Date.now();
    const movement: PlayerMoveCommands = {
      moves: onGameTurn(state),
    };
    const calculationMs = Date.now() - t1;

    console.log(
      `Calculation=${calculationMs} Left=${timeLeft - calculationMs} Moves=${
        movement.moves.flatMap((m) => m.path).length
      }`
    );

    const newState = await api.move(movement);
    const t2 = Date.now();
    const requestMs = Date.now() - t2;

    console.log(
      `Move=${requestMs} Left=${timeLeft - calculationMs - requestMs}`
    );

    if (newState) {
      console.log(newState.errors);
      state = newState;
    }
  }
})();
