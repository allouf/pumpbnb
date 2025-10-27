# Quick Start Guide - PumpBNB Backend

Get the backend running in 5 minutes!

## Prerequisites Check

```bash
node --version  # Should be v20.x or higher
npm --version   # Should be v10.x or higher
```

## Step 1: Install Dependencies (if not already done)

```bash
cd backend
npm install
```

## Step 2: Set Up Environment

```bash
# Copy the example environment file
cp .env.example .env
```

### Minimal Configuration (for testing without external services)

Edit `.env` and set these minimum values:

```env
# Server
NODE_ENV=development
PORT=3001
HOST=localhost

# PostgreSQL (REQUIRED - install PostgreSQL first)
DATABASE_URL="postgresql://postgres:password@localhost:5432/pumpbnb?schema=public"

# BSC Testnet (uses public RPC)
BSC_TESTNET_RPC="https://bsc-testnet-rpc.publicnode.com"
CHAIN_ID=97

# Contract Addresses (from your deployment)
TOKEN_FACTORY_ADDRESS="0x0d4D25e0239e689D7856c9760e74Ee12a2758866"
ASTER_TOKEN_ADDRESS="0x311ECE533632bca662E100B8c4E0EB927EFE2588"

# JWT Secret (change this!)
JWT_SECRET="your-super-secret-jwt-key-change-me"

# Optional (can skip for initial testing)
MONGODB_URI="mongodb://localhost:27017/pumpbnb"
REDIS_URL="redis://localhost:6379"
PINATA_JWT="your-pinata-jwt-token"
```

## Step 3: Set Up PostgreSQL Database

### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL container
docker run --name pumpbnb-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=pumpbnb \
  -p 5432:5432 \
  -d postgres:15
```

### Option B: Using Local PostgreSQL Installation

1. Install PostgreSQL 15+
2. Create database:
```bash
createdb pumpbnb
```

## Step 4: Run Database Migrations

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations to create tables
npm run prisma:migrate
```

## Step 5: Start the Server

```bash
npm run dev
```

You should see:
```
[INFO] PostgreSQL connected via Prisma
[INFO] WebSocket server initialized
[INFO] Connected to BSC Testnet RPC
[INFO] Blockchain indexer started successfully
[INFO] Server running on http://localhost:3001
```

## Step 6: Test the API

Open your browser or use curl:

```bash
# Health check
curl http://localhost:3001/health

# Get recent tokens
curl http://localhost:3001/api/tokens/recent

# Get trending tokens
curl http://localhost:3001/api/tokens/trending
```

## Step 7: Test WebSocket (Optional)

Create a simple HTML file:

```html
<!DOCTYPE html>
<html>
<head>
  <title>WebSocket Test</title>
  <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
</head>
<body>
  <h1>WebSocket Test</h1>
  <div id="messages"></div>

  <script>
    const socket = io('http://localhost:3001');

    socket.on('connect', () => {
      console.log('Connected!');
      socket.emit('subscribe:new-tokens');
    });

    socket.on('token:created', (data) => {
      console.log('New token:', data);
      const div = document.getElementById('messages');
      div.innerHTML += `<p>New token: ${data.name}</p>`;
    });
  </script>
</body>
</html>
```

## Troubleshooting

### "Cannot connect to database"
- Make sure PostgreSQL is running: `pg_isready`
- Check DATABASE_URL in `.env`
- Verify credentials

### "Cannot connect to RPC"
- Check your internet connection
- Try alternative BSC RPC: `https://bsc-testnet.public.blastapi.io`

### "Module not found" errors
- Run `npm install` again
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

### Port 3001 already in use
- Change PORT in `.env` to another value (e.g., 3002)
- Or kill the process: `npx kill-port 3001`

## Optional: Install MongoDB (for enhanced features)

```bash
# Using Docker
docker run --name pumpbnb-mongo \
  -p 27017:27017 \
  -d mongo:latest
```

## Optional: Install Redis (for caching & rate limiting)

```bash
# Using Docker
docker run --name pumpbnb-redis \
  -p 6379:6379 \
  -d redis:latest
```

## Next Steps

1. **View Database**: `npm run prisma:studio` (opens GUI)
2. **Check Logs**: View `logs/all.log`
3. **API Documentation**: See `README.md`
4. **Test with Frontend**: Start the Next.js frontend and connect

## Production Deployment

For production:
1. Use proper PostgreSQL database (not Docker)
2. Set `NODE_ENV=production`
3. Use secure JWT_SECRET
4. Configure Pinata for IPFS
5. Set up Redis for caching
6. Use process manager (PM2)
7. Set up reverse proxy (Nginx)
8. Enable HTTPS

See `README.md` for full production deployment guide.

---

**Need Help?**
- Check `README.md` for full documentation
- Check `IMPLEMENTATION_SUMMARY.md` for technical details
- Review the logs in `logs/` folder
