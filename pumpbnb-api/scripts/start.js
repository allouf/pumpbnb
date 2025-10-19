#!/usr/bin/env node
/**
 * Startup script for production deployment
 * Runs database migrations then starts the server
 * Cross-platform compatible (Windows, Linux, macOS)
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🔄 Running database migrations...');

try {
  // Run database migrations
  execSync('npx prisma db push --skip-generate --accept-data-loss', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  console.log('✅ Database migrations completed successfully');
} catch (error) {
  console.warn('⚠️ Database migrations failed, but continuing...');
  console.warn(error.message);
}

console.log('🚀 Starting server...');

// Start the server
try {
  require('../dist/index.js');
} catch (error) {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}
