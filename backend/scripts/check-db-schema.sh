#!/bin/bash
# Check database schema status

echo "🔍 Checking database schema status..."
echo ""

# Check if we can connect
echo "1. Testing database connection..."
npx prisma db execute --stdin <<EOF
SELECT version();
EOF

if [ $? -eq 0 ]; then
    echo "✅ Database connection successful"
else
    echo "❌ Cannot connect to database"
    exit 1
fi

echo ""
echo "2. Checking if tokens table exists..."
npx prisma db execute --stdin <<EOF
SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'tokens'
);
EOF

echo ""
echo "3. Checking tokens table columns..."
npx prisma db execute --stdin <<EOF
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'tokens'
ORDER BY ordinal_position;
EOF

echo ""
echo "4. Checking all tables..."
npx prisma db execute --stdin <<EOF
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
EOF

echo ""
echo "✅ Schema check complete!"
