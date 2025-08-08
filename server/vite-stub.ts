// Stub file for production build - replaces vite.ts to avoid dependencies
import { serveStatic } from "./vite-production.js";
import type { Express } from "express";
import type { Server } from "http";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  // In production, fall back to static file serving
  console.log("Production mode: Using static file serving instead of Vite");
  serveStatic(app);
}