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

const antMobility = {
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

  for (const ant of state.ants) {
    const path: Hex[] = [];

    if (ant.type === AntType.Worker) {
      if (!ant.food.amount) {
        const [closestFood] = state.food
          .sort(
            (a, b) =>
              (navigator.getDistance(a) ?? Infinity) -
              (navigator.getDistance(b) ?? Infinity)
          )
          .filter(Boolean);

        path.push(
          ...peakBy(
            navigator,
            navigator.getHomeFrom(closestFood, ant.type).reverse(),
            antMobility[ant.type]
          )
        );
      } else {
        path.push(
          ...peakBy(
            navigator,
            navigator.getHomeFrom(ant, ant.type),
            antMobility[ant.type]
          )
        );
      }
    }

    antCommands.push({
      ant: ant.id,
      path,
    });
  }

  return antCommands;
}

// constant magic request time
const rMs = 100;
const api = new Api();

(async function () {
  let state: PlayerResponse | void = undefined;
  while (!state) {
    state = await api.refresh();
    // state = JSON.parse(
    //   readFileSync(
    //     resolve(__dirname, "../../visualizer/arena_response.json")
    //   ).toString("utf8")
    // );
  }

  while (true) {
    const timeLeft = state.nextTurnIn * 1000 - rMs;
    console.log(`\nTurn=${state.turnNo}/300 Left=${timeLeft}`);

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
      `Calculation=${calculationMs} Left=${timeLeft - calculationMs}`
    );

    const t2 = Date.now();
    await api.move(movement);
    // await new Promise((resolve) => setTimeout(resolve, 100));
    const requestMs = Date.now() - t2;
    console.log(
      `Move=${requestMs} Left=${timeLeft - calculationMs - requestMs}`
    );
  }
})();
