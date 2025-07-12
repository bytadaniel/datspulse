import { Api } from "./api";
import { connectMongo } from "./connections/connect-mongo";
import { AutoMoveClass } from "./features/move/index";

(async function () {
  await connectMongo();

  const api = new Api();
  const movement = new AutoMoveClass(api);

  setInterval(() => {
    api.refresh();
    movement.runAutoMove();
  }, 2_000);
})();
