import express from "express";
import path from "node:path";
import { createAppServer } from "./server/_core/app";

// Vercel uses this file as the Express Function entrypoint. The local
// startServer() path remains responsible for long-running local processes.
const { app } = createAppServer();
// Keep the Express import explicit so Vercel's framework detector identifies
// this module as the server entrypoint.
void express;
const publicPath = path.resolve(process.cwd(), "public");

// Vercel serves files under /public as static assets. The fallback keeps the
// client-side wouter routes working when a user opens a deep link directly.
app.use("*", (_req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

export default app;
