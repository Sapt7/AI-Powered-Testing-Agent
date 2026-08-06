import "dotenv/config";
import { createApp } from "./app.js";
import { serverConfig } from "./config.js";

const app = createApp();

// Bind on all interfaces: container platforms route to the published port from
// outside the container, and a loopback-only bind is unreachable there.
app.listen(serverConfig.port, "0.0.0.0", () => {
  console.log(`API listening on port ${serverConfig.port}`);
});
