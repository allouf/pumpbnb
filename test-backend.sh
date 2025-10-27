#!/bin/bash

# Backend System Verification Script
# Tests all critical endpoints and services

BACKEND_URL="https://pumpbnb-backend.onrender.com"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=================================="
echo "PumpBNB Backend System Test"
echo "=================================="
echo ""

# Test 1: Health Check
echo -n "1. Health Check... "
HEALTH=$(curl -s $BACKEND_URL/health)
if echo "$HEALTH" | grep -q '"status":"ok"'; then
    echo -e "${GREEN}✓ PASS${NC}"
    echo "   Response: $HEALTH"
else
    echo -e "${RED}✗ FAIL${NC}"
    echo "   Response: $HEALTH"
fi
echo ""

# Test 2: Database Connection
echo -n "2. Database Connection... "
if echo "$HEALTH" | grep -q '"database":"connected"'; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
fi
echo ""

# Test 3: Redis Connection
echo -n "3. Redis Connection... "
if echo "$HEALTH" | grep -q '"redis":"connected"'; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${YELLOW}⚠ WARNING${NC} (Redis optional for basic functionality)"
fi
echo ""

# Test 4: Tokens API
echo -n "4. Tokens API... "
TOKENS=$(curl -s $BACKEND_URL/api/tokens)
if echo "$TOKENS" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ PASS${NC}"
    COUNT=$(echo "$TOKENS" | grep -o '"total":[0-9]*' | cut -d':' -f2)
    echo "   Total tokens: $COUNT"
else
    echo -e "${RED}✗ FAIL${NC}"
    echo "   Response: $TOKENS"
fi
echo ""

# Test 5: Trending Tokens
echo -n "5. Trending Tokens API... "
TRENDING=$(curl -s $BACKEND_URL/api/tokens/trending)
if echo "$TRENDING" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
fi
echo ""

# Test 6: Platform Stats
echo -n "6. Platform Stats API... "
STATS=$(curl -s $BACKEND_URL/api/users/platform-stats)
if echo "$STATS" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
fi
echo ""

# Test 7: IPFS Metadata Upload
echo -n "7. IPFS Metadata Upload... "
IPFS=$(curl -s -X POST $BACKEND_URL/api/tokens/metadata \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","symbol":"TST","description":"Test token","image":"https://via.placeholder.com/200"}')
if echo "$IPFS" | grep -q '"ipfsHash"'; then
    echo -e "${GREEN}✓ PASS${NC}"
    HASH=$(echo "$IPFS" | grep -o '"ipfsHash":"[^"]*"' | cut -d'"' -f4)
    echo "   IPFS Hash: $HASH"
else
    echo -e "${RED}✗ FAIL${NC}"
    echo "   Response: $IPFS"
fi
echo ""

echo "=================================="
echo "Test Summary"
echo "=================================="
echo ""
echo "Backend URL: $BACKEND_URL"
echo "All critical endpoints tested"
echo ""
echo "Next steps:"
echo "1. Check Render logs for indexer status"
echo "2. Test token creation on BSC Testnet"
echo "3. Verify WebSocket connections"
echo ""
