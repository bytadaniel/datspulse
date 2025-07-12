import { PathPlanner, UnitTarget } from "./algos/3-hex-navigator";
import { Api } from "./api";
import {
  AntMoveCommand,
  PlayerMoveCommands,
} from "./api/dto/player-move-commands";
import { Ant, PlayerResponse } from "./api/dto/player-response";
import { PlayerResponseWithErrors } from "./api/dto/player-response-with-errors";

enum AntType {
  Worker, // 0
  Warrior, // 1
  Scout, // 2
}

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

const antMobility: Record<number, number> = {
  [AntType.Worker]: 5,
  [AntType.Warrior]: 4,
  [AntType.Scout]: 7,
};

// function peakBy(navigator: PathPlanner, hexes: Hex[], limit: number): Hex[] {
//   const limited: Hex[] = [];

//   for (const hex of hexes) {
//     const distance = navigator.getDistance(hex);
//     if (distance! <= limit) {
//       limited.push(hex);
//     } else {
//       break;
//     }
//   }

//   return limited;
// }

function onGameTurn(state: PlayerResponse): AntMoveCommand[] {
  const antCommands: AntMoveCommand[] = [];

  const navigator = getNavigator(state);

  let food = [...state.food];

  const iAnts = state.ants.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {} as Record<string, Ant>);

  const antTargets: UnitTarget[] = state.ants.map((ant) => {
    if (ant.food.amount) {
      return {
        ant,
        target: state.home.filter(
          (c) => !(c.q === state.spot.q && c.r === state.spot.r)
        )[0],
      } satisfies UnitTarget;
    } else {
      let [cFood] = food.sort(
        (a, b) => navigator.getDistance(ant, a) - navigator.getDistance(ant, b)
      );
      if (!cFood) {
        cFood = state.food[0];
      }
      food = food.filter((c) => !(c.q === cFood?.q && c.r === cFood?.r));
      return {
        ant,
        target: cFood,
      } satisfies UnitTarget;
    }
  });

  const movement = navigator.planMoves(antTargets).map((amc) => {
    amc.path = amc.path.filter(
      (c) => !(c.q === iAnts[amc.ant].q && c.r === iAnts[amc.ant].r)
    );
    return amc;
  });

  antCommands.push(...movement);

  return antCommands;
}

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
