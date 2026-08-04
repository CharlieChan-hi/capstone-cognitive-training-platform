import "dotenv/config";
import { setupVite } from "./vite";
import { startServer } from "./start";

startServer((app, server) => {
  return setupVite(app, server);
}).catch(console.error);
