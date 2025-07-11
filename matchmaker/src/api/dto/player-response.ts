export interface Hex {
  q: number;
  r: number;
}

export interface Food {
  amount: number;
  type: number;
}

export interface FoodOnMap extends Food {
  q: number;
  r: number;
}

export interface Ant {
  food: Food;
  health: number;
  id: string;
  lastAttack: Hex;
  lastEnemyAnt: string;
  lastMove: Hex[];
  move: Hex[];
  q: number;
  r: number;
  type: number;
}

export interface PlayerEnemy {
  attack: number;
  food: Food;
  health: number;
  q: number;
  r: number;
  type: number;
}

export interface Tile {
  cost: number;
  q: number;
  r: number;
  type: number;
}

export interface PlayerResponse {
  ants: Ant[];
  enemies: PlayerEnemy[];
  food: FoodOnMap[];
  home: Hex[];
  map: Tile[];
  nextTurnIn: number;
  score: number;
  spot: Hex;
  turnNo: number;
}
