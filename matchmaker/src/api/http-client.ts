import axios from "axios";
import { DATS_TOKEN } from "../env";

export const httpClient = axios.create({
  baseURL: "https://games-test.datsteam.dev",
  timeout: 5000,
  headers: {
    "X-Auth-Token": DATS_TOKEN,
  },
  validateStatus: () => true,
});
