# 📖 PumpBNB API Reference Guide

## 🔗 Base URL
```
http://localhost:5000/api
```

## 🔐 Authentication
Most endpoints require JWT token in Authorization header:
```javascript
headers: {
  'Authorization': 'Bearer <jwt_token>',
  'Content-Type': 'application/json'
}
```

## 🛡️ Authentication Endpoints

### Register User
```http
POST /api/auth/register
```
**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "displayName": "John Doe"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "displayName": "John Doe"
    }
  }
}
```

### Login User
```http
POST /api/auth/login
```
**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Wallet Authentication
```http
POST /api/auth/wallet
```
**Body:**
```json
{
  "walletAddress": "0x742d35Cc...",
  "signature": "signature_string",
  "message": "Login to PumpBNB"
}
```

### Get User Profile
```http
GET /api/auth/profile
```
**Headers:** `Authorization: Bearer <token>`

### Update User Profile
```http
PUT /api/auth/profile
```
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "displayName": "Updated Name",
  "bio": "Updated bio",
  "twitterHandle": "@username"
}
```

## 🪙 Token Endpoints

### List Tokens
```http
GET /api/tokens?page=1&limit=20&sortBy=marketCap&order=desc
```
**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `category` (optional): `graduated`, `about-to-graduate`, `newly-created`
- `featured` (optional): `true` for featured tokens only
- `nsfw` (optional): `true` to include NSFW tokens
- `sortBy` (optional): `createdAt`, `marketCap`, `volume24h`, `priceChange24h`
- `order` (optional): `asc` or `desc`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "token_id",
      "name": "Rocket Fuel",
      "symbol": "FUEL",
      "description": "Powering the next generation of DeFi",
      "contractAddress": "0x8901234...",
      "price": 0.0091,
      "marketCap": 7800000,
      "volume24h": 1800000,
      "priceChange24h": 18.9,
      "holders": 0,
      "graduationProgress": 0,
      "isGraduated": false,
      "websiteUrl": "https://rocketfuel.defi",
      "twitterUrl": "https://twitter.com/rocketfuel",
      "createdAt": "2024-10-18T10:00:00Z",
      "creator": {
        "id": "creator_id",
        "username": "system"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalCount": 8,
    "totalPages": 1,
    "hasMore": false
  }
}
```

### Get Trending Tokens
```http
GET /api/tokens/trending
```

### Get Single Token
```http
GET /api/tokens/:id
```

### Create Token
```http
POST /api/tokens
```
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "name": "My Token",
  "symbol": "MTK",
  "description": "Description of my token",
  "imageUrl": "https://example.com/image.png",
  "websiteUrl": "https://mytoken.com",
  "twitterUrl": "https://twitter.com/mytoken",
  "telegramUrl": "https://t.me/mytoken",
  "totalSupply": "1000000000"
}
```

### Update Token
```http
PUT /api/tokens/:id
```
**Headers:** `Authorization: Bearer <token>`
**Body:** (partial update)
```json
{
  "description": "Updated description",
  "websiteUrl": "https://updated-website.com"
}
```

## 🏥 Health Check
```http
GET /api/health
```
**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-10-18T10:00:00Z",
  "uptime": 1234.56
}
```

## 📝 Error Responses

### Standard Error Format:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error info",
  "details": ["field1 is required", "field2 must be valid email"]
}
```

### Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## 🚀 Rate Limiting
- **Development**: Rate limiting disabled
- **Production**: 1000 requests per 15 minutes per IP

## 📊 Database Models

### User Model Fields:
```typescript
interface User {
  id: string
  email?: string
  username?: string
  walletAddress?: string
  displayName?: string
  bio?: string
  avatar?: string
  twitterHandle?: string
  discordHandle?: string
  telegramHandle?: string
  totalTrades: number
  totalVolume: number
  winRate: number
  reputation: number
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Token Model Fields:
```typescript
interface Token {
  id: string
  name: string
  symbol: string
  description: string
  contractAddress?: string
  chainId: number (default: 56)
  imageUrl?: string
  websiteUrl?: string
  twitterUrl?: string
  telegramUrl?: string
  discordUrl?: string
  marketCap: number
  price: number
  priceChange24h: number
  volume24h: number
  holders: number
  totalSupply: string
  graduationProgress: number
  isGraduated: boolean
  graduatedAt?: DateTime
  isActive: boolean
  isFeatured: boolean
  isNsfw: boolean
  creatorId: string
  createdAt: DateTime
  updatedAt: DateTime
}
```

## 🧪 Testing with cURL

### Get Tokens:
```bash
curl http://localhost:5000/api/tokens
```

### Create Token (with auth):
```bash
curl -X POST http://localhost:5000/api/tokens \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{"name":"Test Token","symbol":"TEST","description":"Test description"}'
```

### Register User:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","displayName":"Test User"}'
```

---

## 🔧 Development Notes

### Available npm Commands:
```bash
# Backend (pumpbnb-api)
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm start            # Start production server
npx prisma studio    # Open database GUI
npx ts-node src/scripts/seedTokens.ts  # Reseed database

# Frontend (pumpbnb-ui)  
npm run dev          # Start Next.js development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Database Operations:
```bash
# Generate Prisma client after schema changes
npx prisma generate

# Reset database (careful!)
npx prisma migrate reset

# View database
npx prisma studio
```

---

**API is fully operational and ready for integration! ✨**