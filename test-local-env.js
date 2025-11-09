// Test script to verify local environment setup
const path = require('path');
const fs = require('fs');

console.log('🔍 BNB PumpFun - Local Environment Test');
console.log('=====================================\n');

// Check current directory
console.log('📂 Current Directory:', process.cwd());
console.log('📂 Script Location:', __dirname);

// Check frontend .env.local
const frontendEnvPath = path.join(__dirname, 'frontend', '.env.local');
console.log('\n🎨 Frontend Environment:');
console.log('   File:', frontendEnvPath);

if (fs.existsSync(frontendEnvPath)) {
  const frontendEnv = fs.readFileSync(frontendEnvPath, 'utf8');
  const apiUrlMatch = frontendEnv.match(/NEXT_PUBLIC_API_URL=(.+)/);
  
  if (apiUrlMatch) {
    const apiUrl = apiUrlMatch[1].trim();
    console.log('   ✅ API URL found:', apiUrl);
    
    if (apiUrl.includes('localhost:3001')) {
      console.log('   ✅ Configured for LOCAL backend');
    } else if (apiUrl.includes('onrender.com')) {
      console.log('   ⚠️  Still using PRODUCTION backend');
    } else {
      console.log('   ❓ Unknown backend configuration');
    }
  } else {
    console.log('   ❌ API URL not found in .env.local');
  }
} else {
  console.log('   ❌ .env.local file not found');
}

// Check backend .env
const backendEnvPath = path.join(__dirname, 'backend', '.env');
console.log('\n🔧 Backend Environment:');
console.log('   File:', backendEnvPath);

if (fs.existsSync(backendEnvPath)) {
  const backendEnv = fs.readFileSync(backendEnvPath, 'utf8');
  const dbUrlMatch = backendEnv.match(/DATABASE_URL=(.+)/);
  const portMatch = backendEnv.match(/PORT=(.+)/);
  const corsMatch = backendEnv.match(/CORS_ORIGIN=(.+)/);
  
  if (portMatch) {
    console.log('   ✅ Port:', portMatch[1].trim());
  }
  
  if (corsMatch) {
    console.log('   ✅ CORS Origin:', corsMatch[1].trim());
  }
  
  if (dbUrlMatch) {
    const dbUrl = dbUrlMatch[1].trim();
    if (dbUrl.includes('render.com')) {
      console.log('   ✅ Database: LIVE (Render)');
    } else if (dbUrl.includes('localhost')) {
      console.log('   ⚠️  Database: Local');
    } else {
      console.log('   ❓ Database: Unknown');
    }
  }
} else {
  console.log('   ❌ .env file not found');
}

// Check if node_modules exist
console.log('\n📦 Dependencies:');
const frontendNodeModules = path.join(__dirname, 'frontend', 'node_modules');
const backendNodeModules = path.join(__dirname, 'backend', 'node_modules');

console.log('   Frontend node_modules:', fs.existsSync(frontendNodeModules) ? '✅ Installed' : '❌ Missing');
console.log('   Backend node_modules:', fs.existsSync(backendNodeModules) ? '✅ Installed' : '❌ Missing');

// Check for .next cache
const nextCache = path.join(__dirname, 'frontend', '.next');
console.log('   Frontend .next cache:', fs.existsSync(nextCache) ? '⚠️  Exists (may need clearing)' : '✅ Cleared');

console.log('\n🎯 Recommended Setup:');
console.log('   1. Run: .\\start-local-dev.ps1');
console.log('   2. Frontend: http://localhost:3000');
console.log('   3. Backend: http://localhost:3001');

console.log('\n✨ Test completed!');