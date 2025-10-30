// Test database connection
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:]*@/, ':****@')); // Hide password

    // Try to connect
    await prisma.$connect();
    console.log('✅ Successfully connected to database!');

    // Try a simple query
    const result = await prisma.$queryRaw`SELECT current_database(), current_user, version()`;
    console.log('📊 Database info:', result);

    // Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    console.log('📋 Tables in database:', tables);

    await prisma.$disconnect();
    console.log('✅ Connection test successful!');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testConnection();
