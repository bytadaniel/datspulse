import { Api } from "./api";
import { connectMongo } from "./connections/connect-mongo";

(async function () {
  await connectMongo();

  const api = new Api();

  setInterval(() => api.refresh(), 1_000);
})();
