# PumpBNB Backend API

Backend infrastructure for PumpBNB - A BNB Chain-based meme coin launchpad.

## Features

- **RESTful API** - Express.js with TypeScript
- **Real-time Updates** - WebSocket support via Socket.io
- **Blockchain Indexer** - Automatic event listening from BSC smart contracts
- **Database Layer** - PostgreSQL (Prisma), MongoDB, Redis
- **IPFS Integration** - Token metadata storage via Pinata
- **Authentication** - JWT-based auth (optional for public endpoints)
- **Rate Limiting** - Redis-backed rate limiting
- **Comprehensive Logging** - Winston logger with file rotation

## Tech Stack

- **Runtime**: Node.js 20+ with TypeScript
- **Framework**: Express.js 5.x
- **Databases**: PostgreSQL 15+, MongoDB, Redis
- **ORM**: Prisma
- **Blockchain**: Ethers.js v6
- **WebSocket**: Socket.io v4
- **Storage**: IPFS via Pinata

## Prerequisites

- Node.js 20 or higher
- PostgreSQL 15 or higher
- MongoDB (optional, for metadata)
- Redis (optional, for caching and rate limiting)
- BSC Testnet RPC endpoint (or mainnet for production)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Configure your `.env` file with proper values:
- Database URLs
- BSC RPC endpoint
- Contract addresses
- Pinata credentials

4. Generate Prisma client:
```bash
npm run prisma:generate
```

5. Run database migrations:
```bash
npm run prisma:migrate
```

## Environment Variables

See `.env.example` for all required configuration. Key variables:

- `DATABASE_URL` - PostgreSQL connection string
- `MONGODB_URI` - MongoDB connection string (optional)
- `REDIS_URL` - Redis connection string (optional)
- `BSC_TESTNET_RPC` - BSC Testnet RPC endpoint
- `TOKEN_FACTORY_ADDRESS` - Deployed TokenFactory contract address
- `ASTER_TOKEN_ADDRESS` - ASTER token address
- `PINATA_JWT` - Pinata API JWT token

## Development

Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:3001` (configurable via PORT env variable).

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Tokens
- `GET /api/tokens` - List all tokens (paginated)
- `GET /api/tokens/:address` - Get token details
- `GET /api/tokens/trending` - Get trending tokens
- `GET /api/tokens/recent` - Get recently created tokens
- `GET /api/tokens/graduated` - Get graduated tokens
- `GET /api/tokens/search?q=query` - Search tokens
- `GET /api/tokens/creator/:address` - Get tokens by creator
- `GET /api/tokens/:address/holders` - Get token holders
- `POST /api/tokens/metadata` - Upload token metadata to IPFS

### Trading
- `GET /api/trades/:tokenAddress` - Get trade history
- `GET /api/trades/:tokenAddress/chart` - Get chart data (OHLC)
- `GET /api/trades/:tokenAddress/stats` - Get trading statistics
- `POST /api/trades/estimate` - Estimate trade output
- `GET /api/trades/user/:address` - Get user trade history

### Users
- `GET /api/users/:address/portfolio` - Get user portfolio
- `GET /api/users/:address/history` - Get transaction history
- `GET /api/users/:address/pnl` - Get profit/loss data
- `GET /api/users/:address/watchlist` - Get watchlist
- `POST /api/users/:address/watchlist` - Add to watchlist
- `DELETE /api/users/:address/watchlist/:tokenAddress` - Remove from watchlist
- `POST /api/users/:address/sync` - Sync balances from blockchain

## WebSocket Events

### Client → Server
- `subscribe:token` - Subscribe to token-specific updates
- `unsubscribe:token` - Unsubscribe from token updates
- `subscribe:new-tokens` - Subscribe to new token creations
- `subscribe:trending` - Subscribe to trending updates

### Server → Client
- `token:created` - New token created
- `token:trade` - New trade executed
- `token:price` - Price update
- `token:graduated` - Token graduated to PancakeSwap
- `trending:update` - Trending tokens updated

## Database Schema

The PostgreSQL database uses Prisma ORM with the following main tables:

- `tokens` - Token metadata and details
- `trades` - All trade transactions
- `token_stats` - Aggregated token statistics
- `user_portfolios` - User token holdings
- `watchlists` - User watchlists
- `graduation_events` - Token graduation events
- `platform_stats` - Platform-wide statistics

## Blockchain Indexer

The backend automatically listens to smart contract events:

- **TokenCreated** - New token deployments
- **Buy/Sell** - Trading activity on bonding curves
- **Graduation** - Token migrations to PancakeSwap

Events are indexed and stored in PostgreSQL, then broadcast via WebSocket to connected clients.

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio

## Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Express middleware
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   │   ├── database.service.ts
│   │   ├── indexer.service.ts
│   │   ├── ipfs.service.ts
│   │   ├── token.service.ts
│   │   ├── trade.service.ts
│   │   ├── user.service.ts
│   │   └── websocket.service.ts
│   ├── types/            # TypeScript types
│   ├── utils/            # Utility functions
│   ├── app.ts            # Express app setup
│   └── server.ts         # Server entry point
├── prisma/
│   └── schema.prisma     # Database schema
├── logs/                 # Application logs
├── .env                  # Environment variables
├── .env.example          # Environment template
├── tsconfig.json         # TypeScript config
└── package.json
```

## Error Handling

All errors are handled centrally through the error middleware. API responses follow this format:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description"
}
```

## Rate Limiting

- Default: 100 requests per 15 minutes per IP
- Configurable via environment variables
- Uses Redis for distributed rate limiting (optional)

## Logging

Logs are written to:
- `logs/all.log` - All log levels
- `logs/error.log` - Error logs only
- Console output (development)

## Security

- Helmet.js for security headers
- CORS configuration
- Input validation with Joi
- JWT authentication (optional per endpoint)
- Rate limiting to prevent abuse

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure production database URLs
3. Set secure JWT secret
4. Configure proper CORS origins
5. Use a process manager (PM2 recommended)
6. Set up reverse proxy (Nginx)
7. Enable HTTPS
8. Configure monitoring and logging

## Monitoring

The backend exposes:
- Health check endpoint (`/health`)
- WebSocket connection metrics
- Database connection status

Recommended external monitoring:
- Datadog APM
- Sentry for error tracking
- Custom dashboards for business metrics

## Contributing

1. Follow TypeScript strict mode
2. Use ESLint and Prettier
3. Write tests for new features
4. Update API documentation
5. Follow the existing code structure

## License

MIT License - See LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: [Project Repository]
- Documentation: See `/docs` folder
- Email: support@pumpbnb.io
