import { HexNavigator } from "./algos/dijkstra2-hex-navigator";
import { Api } from "./api";
import {
  AntMoveCommand,
  PlayerMoveCommands,
} from "./api/dto/player-move-commands";
import {
  Ant,
  Hex,
  PlayerEnemy,
  PlayerResponse,
} from "./api/dto/player-response";
import { PlayerResponseWithErrors } from "./api/dto/player-response-with-errors";

enum AntType {
  Worker, // 0
  Warrior, // 1
  Scout, // 2
}

let _navigator: HexNavigator;
function getNavigator(state: PlayerResponse): HexNavigator {
  if (!_navigator) {
    _navigator = new HexNavigator(state.home);
    _navigator.updateMap(state.map);
  }

  const units: (Ant | PlayerEnemy)[] = [...state.ants, ...state.enemies];

  _navigator.updateUnits(units);

  return _navigator;
}

const api = new Api();

const antMobility: Record<number, number> = {
  [AntType.Worker]: 5,
  [AntType.Warrior]: 4,
  [AntType.Scout]: 7,
};

function peakBy(navigator: HexNavigator, hexes: Hex[], limit: number): Hex[] {
  const limited: Hex[] = [];

  for (const hex of hexes) {
    const distance = navigator.getDistance(hex);
    if (distance! <= limit) {
      limited.push(hex);
    } else {
      break;
    }
  }

  return limited;
}

function onGameTurn(state: PlayerResponse): AntMoveCommand[] {
  const antCommands: AntMoveCommand[] = [];

  const navigator = getNavigator(state);

  let food = [...state.food];

  for (const ant of state.ants) {
    const path: Hex[] = [];

    // все муравьи идут до еды
    let closestFood: Hex | undefined;

    if (!ant.food.amount) {
      closestFood = food
        .sort(
          (a, b) =>
            (navigator.getDistance(a) ?? Infinity) -
            (navigator.getDistance(b) ?? Infinity)
        )
        .filter(Boolean)[0];

      food = food.filter(
        (c) => !(c.q === closestFood?.q && c.r === closestFood?.r)
      );

      let xPath = navigator.getHomeFrom(closestFood, ant.type).reverse();
      xPath.filter((c) => !(c.q === ant.q && c.r === ant.r));
      path.push(...peakBy(navigator, xPath, antMobility[ant.type]));
    } else {
      let xPath = navigator.getHomeFrom(ant, ant.type);
      xPath = xPath.filter((c) => !(c.q === ant.q && c.r === ant.r));

      path.push(...peakBy(navigator, xPath, antMobility[ant.type]));
    }

    console.log({
      ant: { q: ant.q, r: ant.r },
      closestFood,
      path,
    });

    antCommands.push({
      ant: ant.id,
      path,
    });
  }

  return antCommands;
}

// constant magic request time
const rMs = 100;

(async function () {
  let state: PlayerResponse | PlayerResponseWithErrors =
    undefined as unknown as any;

  while (!state) {
    const newState = await api.refresh();

    if (newState) {
      state = newState;
    }
  }

  setInterval(async () => {
    const newState = await api.refresh();
    if (newState) {
      console.log("RefreshState");
      state = newState;
    }
  }, 1000);

  while (true) {
    const timeLeft = state.nextTurnIn * 1000;
    console.log(`\nTurn=${state.turnNo} Left=${timeLeft}`);

    if (timeLeft < 0) {
      await new Promise((resolve) => setTimeout(resolve, 2000 + timeLeft));
      continue;
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
