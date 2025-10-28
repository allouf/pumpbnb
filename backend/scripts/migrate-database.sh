#!/bin/bash
# Database Migration Script for Render
# Run this in Render Shell to fix database schema

echo "🔄 Starting database migration..."

# Reset and recreate database schema
echo "📦 Resetting database..."
npx prisma migrate reset --force --skip-generate

echo "🚀 Deploying migrations..."
npx prisma migrate deploy

echo "🔨 Generating Prisma Client..."
npx prisma generate

echo "✅ Database migration complete!"
echo ""
echo "📋 Database should now have:"
echo "  ✅ tokens table"
echo "  ✅ token_stats table"
echo "  ✅ trades table"
echo "  ✅ graduation_events table"
echo "  ✅ user_portfolio table"
echo "  ✅ users table"
echo ""
echo "🔄 Restart your backend service to apply changes"
