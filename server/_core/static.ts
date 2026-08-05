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
      const isHashedAsset = filePath.includes(`${path.sep}assets${path.sep}`);

      if (isHashedAsset) {
        // Vite fingerprints production assets, so they can be cached safely
        // until a new HTML document points at the next fingerprint.
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        res.setHeader("CDN-Cache-Control", "public, max-age=31536000, immutable");
        res.setHeader("Vercel-CDN-Cache-Control", "public, max-age=31536000, immutable");
      } else if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-store");
      } else {
        // Small stable assets such as the logo should not block a repeat visit
        // on another network round trip.
        res.setHeader("Cache-Control", "public, max-age=86400");
        res.setHeader("CDN-Cache-Control", "public, max-age=86400");
        res.setHeader("Vercel-CDN-Cache-Control", "public, max-age=86400");
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
