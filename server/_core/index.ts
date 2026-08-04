import "dotenv/config";
import { serveStatic } from "./static";
import { startServer } from "./start";

startServer(app => {
  serveStatic(app);
}).catch(console.error);
