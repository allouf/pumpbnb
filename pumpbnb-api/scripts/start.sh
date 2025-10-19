#!/bin/sh
# Startup script for production deployment
# Runs database migrations then starts the server

echo "🔄 Running database migrations..."
npx prisma db push --skip-generate --accept-data-loss

if [ $? -eq 0 ]; then
  echo "✅ Database migrations completed successfully"
else
  echo "⚠️ Database migrations failed, but continuing..."
fi

echo "🚀 Starting server..."
node dist/index.js
