import { mongodb } from "../context";

export async function connectMongo() {
  try {
    await mongodb.connect();
    console.log("MongoDB connection established");
  } catch (error) {
    console.log("MongoDB connection broken", error);
  }
}
