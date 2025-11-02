# Trades API Endpoints Documentation

## Base URL
```
http://localhost:3001/api/v2
```

## Endpoints Overview

### 1. Get Token Trades (with Filtering & Pagination)
**GET** `/tokens/:address/trades`

Get all trades for a specific token with advanced filtering options.

**Parameters:**
- `address` (path) - Token contract address

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `type` | string | 'all' | Filter type: 'all', 'my', 'dev', 'tracked' |
| `traderAddress` | string | - | Trader wallet address (required if type='my') |
| `minAmount` | string | - | Minimum ASTER amount filter |
| `maxAmount` | string | - | Maximum ASTER amount filter |
| `startTime` | ISO 8601 | - | Start timestamp filter |
| `endTime` | ISO 8601 | - | End timestamp filter |
| `page` | number | 1 | Page number |
| `limit` | number | 50 | Items per page (max: 100) |
| `sortBy` | string | 'timestamp' | Sort field: 'timestamp', 'price', 'volume' |
| `sortOrder` | string | 'desc' | Sort order: 'asc', 'desc' |

**Example Request:**
```bash
GET /api/v2/tokens/0x123.../trades?page=1&limit=20&sortBy=timestamp&sortOrder=desc
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tokenAddress": "0x123...",
      "trader": "0xabc...",
      "isBuy": true,
      "amountIn": "1000000000000000000",
      "amountOut": "50000000000000000000",
      "fee": "10000000000000000",
      "timestamp": "2025-11-02T10:30:00.000Z",
      "txHash": "0xdef...",
      "blockNumber": 12345678,
      "price": "0.02",
      "marketCap": "50000",
      "asterAmount": "1000000000000000000",
      "tokenAmount": "50000000000000000000"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasMore": true
  }
}
```

---

### 2. Get Recent Trades (Cached)
**GET** `/tokens/:address/trades/recent`

Get recent trades for a token. This endpoint is cached for faster response times.

**Parameters:**
- `address` (path) - Token contract address

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 20 | Number of trades (max: 100) |

**Cache TTL:** 10 seconds (configurable via CACHE_TRADES_TTL)

**Example Request:**
```bash
GET /api/v2/tokens/0x123.../trades/recent?limit=20
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tokenAddress": "0x123...",
      "trader": "0xabc...",
      "isBuy": false,
      "asterAmount": "500000000000000000",
      "tokenAmount": "25000000000000000000",
      "price": "0.02",
      "timestamp": "2025-11-02T10:35:00.000Z",
      "txHash": "0xghi..."
    }
  ],
  "count": 20
}
```

---

### 3. Get Trade Statistics
**GET** `/tokens/:address/trades/stats`

Get aggregated trade statistics for a token within a time window.

**Parameters:**
- `address` (path) - Token contract address

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `timeWindow` | number | 86400000 | Time window in milliseconds (default: 24h) |

**Example Request:**
```bash
GET /api/v2/tokens/0x123.../trades/stats?timeWindow=86400000
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "totalTrades": 452,
    "buyCount": 280,
    "sellCount": 172,
    "totalVolume": "125000000000000000000",
    "buyVolume": "80000000000000000000",
    "sellVolume": "45000000000000000000",
    "buyRatio": 0.6194690265486726
  }
}
```

---

### 4. Get Single Trade by Transaction Hash
**GET** `/trades/:txHash`

Get detailed information about a specific trade by its transaction hash.

**Parameters:**
- `txHash` (path) - Transaction hash

**Example Request:**
```bash
GET /api/v2/trades/0xdef...
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tokenAddress": "0x123...",
    "trader": "0xabc...",
    "isBuy": true,
    "asterAmount": "1000000000000000000",
    "tokenAmount": "50000000000000000000",
    "price": "0.02",
    "marketCap": "50000",
    "timestamp": "2025-11-02T10:30:00.000Z",
    "txHash": "0xdef...",
    "blockNumber": 12345678,
    "token": {
      "name": "Test Token",
      "symbol": "TEST",
      "imageUrl": "https://..."
    }
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "Trade not found"
}
```

---

### 5. Get Trader's Trades
**GET** `/traders/:address/trades`

Get all trades for a specific trader across all tokens.

**Parameters:**
- `address` (path) - Trader wallet address

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 50 | Items per page (max: 100) |
| `tokenAddress` | string | - | Filter by specific token |

**Example Request:**
```bash
GET /api/v2/traders/0xabc.../trades?page=1&limit=50
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tokenAddress": "0x123...",
      "trader": "0xabc...",
      "isBuy": true,
      "asterAmount": "1000000000000000000",
      "tokenAmount": "50000000000000000000",
      "price": "0.02",
      "timestamp": "2025-11-02T10:30:00.000Z",
      "txHash": "0xdef...",
      "token": {
        "name": "Test Token",
        "symbol": "TEST",
        "imageUrl": "https://...",
        "address": "0x123..."
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 85,
    "totalPages": 2,
    "hasMore": true
  }
}
```

---

## Filter Examples

### Get Your Own Trades
```bash
GET /api/v2/tokens/0x123.../trades?type=my&traderAddress=0xYourWallet...
```

### Get Creator's Trades
```bash
GET /api/v2/tokens/0x123.../trades?type=dev
```

### Get Trades Above 10 ASTER
```bash
GET /api/v2/tokens/0x123.../trades?minAmount=10000000000000000000
```

### Get Trades in Last Hour
```bash
GET /api/v2/tokens/0x123.../trades?startTime=2025-11-02T09:00:00Z&endTime=2025-11-02T10:00:00Z
```

### Get Largest Trades First
```bash
GET /api/v2/tokens/0x123.../trades?sortBy=volume&sortOrder=desc
```

---

## Caching Strategy

The API implements intelligent caching to optimize performance:

- **Recent Trades** (`/trades/recent`): Cached for 10 seconds
- **Token Stats** (`/trades/stats`): Cached for 30 seconds
- **Paginated Trades**: Not cached (dynamic filters)
- **Single Trade**: Not cached (rarely changes)

Cache keys follow this pattern:
```
token:trades:{tokenAddress}:{limit}
token:stats:{tokenAddress}
```

Cache can be invalidated programmatically when new trades are indexed.

---

## Error Responses

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message",
  "statusCode": 400
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `404` - Not Found (token or trade doesn't exist)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

---

## Rate Limiting

All API endpoints are rate-limited to prevent abuse:

- **Window:** 60 seconds
- **Max Requests:** 100 per window

Rate limit headers are included in all responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699012345
```

---

## Next Steps

After implementing trades endpoints, the following endpoints will be added:

- **Holders** - `/api/v2/tokens/:address/holders`
- **Comments** - `/api/v2/tokens/:address/comments`
- **OHLCV** - `/api/v2/tokens/:address/ohlcv`
- **Token Info** - `/api/v2/tokens/:address`
- **Chat** - `/api/v2/tokens/:address/chat`

---

**Status:** ✅ Trades API Complete
**Version:** 1.0.0
**Last Updated:** 2025-11-02
