import { build } from 'esbuild';

await build({
  entryPoints: ['server/index.ts'],
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

console.log('✅ Server build completed successfully!');