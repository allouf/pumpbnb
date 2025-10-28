#!/bin/bash
# Startup script for Render - handles database migration

echo "🚀 Starting PumpBNB Backend..."

# Check if we should force reset the database
if [ "$FORCE_DB_RESET" = "true" ]; then
    echo "⚠️  FORCE_DB_RESET=true detected, resetting database..."
    npx prisma migrate reset --force --skip-generate --skip-seed
    echo "✅ Database reset complete"
fi

# Always run migrations on startup
echo "📦 Running database migrations..."
npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo "✅ Migrations applied successfully"
else
    echo "❌ Migration failed, attempting to continue..."
fi

# Start the application
echo "🎯 Starting Node.js server..."
node dist/server.js
