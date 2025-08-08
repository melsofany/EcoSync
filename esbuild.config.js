import { build } from 'esbuild';
import fs from 'fs';
import path from 'path';

// Create a completely clean production index file
const productionIndexContent = `
import express, { type Request, type Response, type NextFunction } from "express";
import { registerRoutes } from "./routes.js";

const app = express();

// Trust proxy for Railway deployment
app.set("trust proxy", true);

// Set environment to production
app.set("env", "production");

// Request logging middleware (simplified for production)
app.use((req, _res, next) => {
  const logLine = \`\${req.method} \${req.originalUrl}\`;
  console.log(\`\${new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit", 
    second: "2-digit",
    hour12: true,
  })} [express] \${logLine}\`);
  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  // Production static file serving
  const { serveStatic } = await import("./vite-production.js");
  serveStatic(app);

  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(port, "0.0.0.0", () => {
    console.log(\`\${new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit", 
      hour12: true,
    })} [express] serving on port \${port}\`);
    console.log(\`Health endpoint available at: http://0.0.0.0:\${port}/api/health\`);
  });
})();
`;

fs.writeFileSync('server/index-production.ts', productionIndexContent);

await build({
  entryPoints: ['server/index-production.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outdir: 'dist',
  packages: 'external',
  external: [
    // Completely exclude all vite-related packages
  ],
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  banner: {
    js: '// Production build - No Vite dependencies'
  }
});

// Clean up temporary file
fs.unlinkSync('server/index-production.ts');

console.log('✅ Server build completed - 100% Vite-free!');