import { Ant, FoodOnMap, Hex, PlayerEnemy, Tile } from "./player-response";

export interface PlayerResponseWithErrors {
  ants: Ant[];
  enemies: PlayerEnemy[];
  food: FoodOnMap[];
  home: Hex[];
  map: Tile[];
  nextTurnIn: number;
  score: number;
  spot: Hex;
  turnNo: number;
  errors: string[]; // Дополнительное поле с ошибками
}
