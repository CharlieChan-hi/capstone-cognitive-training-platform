import net from "net";
import type { Express } from "express";
import type { Server } from "http";
import { createAppServer } from "./app";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const probe = net.createServer();
    probe.listen(port, () => {
      probe.close(() => resolve(true));
    });
    probe.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

function getPreferredPort(): number {
  const rawPort = process.env.PORT || "3000";
  const port = Number(rawPort);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT value: ${rawPort}`);
  }

  return port;
}

export async function startServer(
  configure: (app: Express, server: Server) => void | Promise<void>
) {
  const { app, server } = createAppServer();
  await configure(app, server);

  const preferredPort = getPreferredPort();
  const isProduction = process.env.NODE_ENV === "production";
  // Managed hosts probe the exact PORT they assign. Fallback probing is only
  // useful for local development; changing ports in production makes a
  // healthy process unreachable.
  const port = isProduction
    ? preferredPort
    : await findAvailablePort(preferredPort);

  if (!isProduction && port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
