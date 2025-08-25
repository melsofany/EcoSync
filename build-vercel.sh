#!/bin/bash

echo "🔨 Building for Vercel..."

# Build client
echo "📦 Building client..."
npm run build

# Build server with special flags for Vercel
echo "🛠️ Building server for Vercel..."
npx esbuild server/index.ts \
  --platform=node \
  --target=node20 \
  --bundle \
  --format=esm \
  --outfile=dist/index.js \
  --external:bcrypt \
  --external:better-sqlite3 \
  --external:drizzle-orm \
  --external:drizzle-kit \
  --external:drizzle-zod \
  --external:pg \
  --external:@neondatabase/serverless \
  --external:ws \
  --external:@google-cloud/storage \
  --external:googleapis \
  --external:google-auth-library \
  --external:node-telegram-bot-api \
  --external:memorystore \
  --packages=external \
  --minify

echo "✅ Build complete!"