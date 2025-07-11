import { MongoClient } from "mongodb";
import { MONGO_URL } from "./env";

export const mongodb = new MongoClient(MONGO_URL);
