import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath, {
    index: false,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-store");
      }
    },
  }));

  // Keep client-side routes working, but do not turn missing assets/API calls
  // into an HTML response that causes a blank page in the browser.
  app.use("*", (req, res) => {
    const acceptsHtml = req.method === "GET" &&
      typeof req.headers.accept === "string" &&
      req.headers.accept.includes("text/html");

    if (!acceptsHtml || req.path.startsWith("/assets/")) {
      res.status(404).end();
      return;
    }

    res.setHeader("Cache-Control", "no-store");
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
