#!/bin/bash

# Backend Deployment Verification Script
# Run this after Render deployment completes

BACKEND_URL="https://pumpbnb-backend.onrender.com"

echo "🔍 Testing Backend Deployment..."
echo "================================"
echo ""

# Test 1: Health Check
echo "1️⃣ Health Check:"
echo "   GET $BACKEND_URL/health"
HEALTH=$(curl -s "$BACKEND_URL/health")
echo "   Response: $HEALTH"

if echo "$HEALTH" | grep -q '"status":"ok"'; then
    echo "   ✅ PASSED"
else
    echo "   ❌ FAILED"
fi
echo ""

# Test 2: Tokens API (Previously Failing)
echo "2️⃣ Tokens API (previously failing with filter error):"
echo "   GET $BACKEND_URL/api/tokens"
TOKENS=$(curl -s "$BACKEND_URL/api/tokens")
echo "   Response: $TOKENS"

if echo "$TOKENS" | grep -q '"success":true'; then
    echo "   ✅ PASSED - No more filter errors!"
else
    echo "   ❌ FAILED - Still getting errors"
fi
echo ""

# Test 3: Trending Tokens
echo "3️⃣ Trending Tokens API:"
echo "   GET $BACKEND_URL/api/tokens/trending"
TRENDING=$(curl -s "$BACKEND_URL/api/tokens/trending")
echo "   Response: $TRENDING"

if echo "$TRENDING" | grep -q '"success":true'; then
    echo "   ✅ PASSED"
else
    echo "   ❌ FAILED"
fi
echo ""

# Test 4: Recent Tokens
echo "4️⃣ Recent Tokens API:"
echo "   GET $BACKEND_URL/api/tokens/recent"
RECENT=$(curl -s "$BACKEND_URL/api/tokens/recent")
echo "   Response: $RECENT"

if echo "$RECENT" | grep -q '"success":true'; then
    echo "   ✅ PASSED"
else
    echo "   ❌ FAILED"
fi
echo ""

echo "================================"
echo "✅ All Critical Tests Completed!"
echo ""
echo "📝 Next Steps:"
echo "   1. Check Render logs for 'Started polling for new events'"
echo "   2. Test frontend at: https://pumpbnb-frontend.onrender.com/tokens"
echo "   3. Create a test token to verify indexing works"
echo ""
