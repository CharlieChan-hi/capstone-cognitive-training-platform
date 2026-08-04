import express from "express";
import path from "node:path";
import { createAppServer } from "./server/_core/app.js";

// Vercel uses this file as the Express Function entrypoint. The local
// startServer() path remains responsible for long-running local processes.
const { app } = createAppServer();
// Keep the Express import explicit so Vercel's framework detector identifies
// this module as the server entrypoint.
void express;
const publicPath = path.resolve(process.cwd(), "public");

// The Express function must serve the built assets itself. Depending on the
// detected Vercel framework, the platform filesystem route is not guaranteed
// to run before this function, so relying on it can return index.html for a
// JavaScript request and leave the browser with a blank page.
app.use(express.static(publicPath, {
  index: false,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith(".html")) {
      res.setHeader("Cache-Control", "no-store");
    }
  },
}));

// Keep the client-side wouter routes working when a user opens a deep link
// directly, but never turn a missing asset/API request into an HTML response.
app.use("*", (req, res) => {
  const acceptsHtml = req.method === "GET" &&
    typeof req.headers.accept === "string" &&
    req.headers.accept.includes("text/html");

  if (!acceptsHtml || req.path.startsWith("/assets/")) {
    res.status(404).end();
    return;
  }

  res.setHeader("Cache-Control", "no-store");
  res.sendFile(path.join(publicPath, "index.html"));
});

export default app;
