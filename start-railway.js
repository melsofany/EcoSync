#!/usr/bin/env node
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if dist/index.js exists
const distPath = path.join(__dirname, 'dist', 'index.js');
const publicPath = path.join(__dirname, 'dist', 'public');

console.log('🔍 Checking build files...');
console.log('📁 Current directory:', process.cwd());
console.log('📂 __dirname:', __dirname);
console.log('📄 Looking for:', distPath);
console.log('📁 Looking for public:', publicPath);

if (!fs.existsSync(distPath)) {
  console.error('❌ dist/index.js not found!');
  console.log('📦 Available files:');
  const files = fs.readdirSync(__dirname);
  files.forEach(file => console.log('  -', file));
  
  if (fs.existsSync('dist')) {
    console.log('📁 Contents of dist:');
    const distFiles = fs.readdirSync('dist');
    distFiles.forEach(file => console.log('  -', file));
  }
  
  process.exit(1);
}

if (!fs.existsSync(publicPath)) {
  console.error('⚠️ dist/public not found, static files may not work');
}

console.log('✅ Build files found, starting server...');

// Import and run the main server
import('./dist/index.js').catch(err => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});