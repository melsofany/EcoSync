import { build } from 'esbuild';
import fs from 'fs';

// Copy index.ts and replace vite import for production
const indexContent = fs.readFileSync('server/index.ts', 'utf8');
const productionContent = indexContent.replace(
  'await import("./vite.js")',
  'await import("./vite-stub.js")'
);
fs.writeFileSync('server/index-production.ts', productionContent);

// Copy vite-production.ts 
const viteProductionContent = fs.readFileSync('server/vite-production.ts', 'utf8');
fs.writeFileSync('server/vite-stub-copy.ts', viteProductionContent);

await build({
  entryPoints: ['server/index-production.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outdir: 'dist',
  packages: 'external',
  external: [
    'vite',
    '@vitejs/plugin-react',
    '@replit/vite-plugin-cartographer',
    '@replit/vite-plugin-runtime-error-modal',
    '@tailwindcss/vite'
  ],
  define: {
    'process.env.NODE_ENV': '"production"'
  }
});

// Clean up temporary files
fs.unlinkSync('server/index-production.ts');
if (fs.existsSync('server/vite-stub-copy.ts')) {
  fs.unlinkSync('server/vite-stub-copy.ts');
}

console.log('✅ Server build completed successfully!');