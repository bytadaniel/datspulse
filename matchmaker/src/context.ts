import { MongoClient } from "mongodb";
import { Game } from "./entities/game";
import { MONGO_URL } from "./env";

export const game = new Game();

export const mongodb = new MongoClient(MONGO_URL);
