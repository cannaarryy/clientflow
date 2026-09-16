import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
dotenv.config();

import { createApp } from "./app.js";
import { env } from "./config/env.js";

const app = createApp();

app.listen(env.port, () => {
  console.log(`ClientFlow API v0.1 listening on http://localhost:${env.port}`);
});
