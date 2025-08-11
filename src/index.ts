// src/index.ts
import app from "./sockets/app";
import connectToMongo from "./config/database";
import { getEnv  } from "./config/env";

connectToMongo().then(() => {
  app.listen(Number(getEnv.PORT), () => {
    console.log(`🚀 Server running at http://localhost:${getEnv.PORT}`);
  });
});
