import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export function serveStatic(app: Express) {
  // Try multiple possible paths for the build directory
  const possiblePaths = [
    path.resolve(import.meta.dirname, "public"),
    path.resolve(process.cwd(), "dist", "public"),
    path.resolve(process.cwd(), "public"),
    path.resolve(import.meta.dirname, "..", "dist", "public")
  ];

  let distPath: string | null = null;
  
  for (const tryPath of possiblePaths) {
    if (fs.existsSync(tryPath)) {
      distPath = tryPath;
      console.log(`✅ Found static files at: ${tryPath}`);
      break;
    }
  }

  if (!distPath) {
    console.error(`❌ Could not find build directory. Tried paths:`);
    possiblePaths.forEach(p => console.error(`  - ${p}`));
    throw new Error(
      `Could not find the build directory, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}