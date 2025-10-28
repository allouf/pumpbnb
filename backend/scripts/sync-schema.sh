#!/bin/bash
# Script to sync Prisma schema to database
# This should be run on Render or any environment with database access

echo "🔄 Syncing Prisma schema to database..."

# Use db push to sync schema without migrations
npx prisma db push --accept-data-loss

echo "✅ Schema sync complete!"

# Generate Prisma client
echo "🔄 Generating Prisma client..."
npx prisma generate

echo "✅ Done!"
