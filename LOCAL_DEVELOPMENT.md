# BNB PumpFun - Local Development Guide

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **PowerShell** (for enhanced scripts)

### Option 1: PowerShell Script (Recommended)
```powershell
# Start both frontend and backend
.\start-local-dev.ps1

# Start only backend
.\start-local-dev.ps1 -BackendOnly

# Start only frontend
.\start-local-dev.ps1 -FrontendOnly

# Clean install (removes node_modules and caches)
.\start-local-dev.ps1 -Clean
```

### Option 2: Batch File (Simple)
```cmd
# Double-click or run
start-local-dev.bat
```

### Option 3: Manual Setup
```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

## 🔧 Configuration

### Environment Files

#### Backend (.env)
- **Database**: Connected to **LIVE PostgreSQL** (Render)
- **Redis**: Connected to **LIVE Redis** (Render)  
- **Port**: 3001
- **CORS**: Configured for localhost:3000

#### Frontend (.env.local)
- **API URL**: http://localhost:3001 (local backend)
- **Chain**: BSC Testnet (97)
- **Contracts**: Live testnet contracts

### Database Connection
```
✅ LIVE DATABASE: Your local backend connects to the production PostgreSQL database
✅ LIVE REDIS: Real-time features work with production Redis
✅ LIVE BLOCKCHAIN: Connected to BSC Testnet with real contracts
```

## 🌐 Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Next.js React app |
| **Backend API** | http://localhost:3001 | Express.js API server |
| **Health Check** | http://localhost:3001/api/health | Backend health status |
| **API Docs** | http://localhost:3001/api/docs | API documentation |

## 🛠️ Development Workflow

### 1. Make Changes
- **Frontend**: Edit files in `frontend/` - Hot reload enabled
- **Backend**: Edit files in `backend/src/` - Nodemon restarts automatically

### 2. Database Changes
```bash
cd backend
npx prisma generate    # Generate client after schema changes
npx prisma db push     # Push schema to database
npx prisma studio      # Visual database editor
```

### 3. Testing
```bash
# Frontend build test
cd frontend
npm run build

# Backend compilation test
cd backend
npm run build

# Lint check
npm run lint
```

## 🔍 Debugging

### Backend Logs
```powershell
# In PowerShell (if using .ps1 script)
Receive-Job -Id [JobId] -Keep

# Or check the backend console window
```

### Common Issues

#### Port Already in Use
```bash
# Kill processes on ports 3000 or 3001
npx kill-port 3000
npx kill-port 3001

# Or in PowerShell
Get-Process -Name node | Stop-Process -Force
```

#### Database Connection Issues
- Check internet connection (using live database)
- Verify DATABASE_URL in `backend/.env`
- Check Render service status

#### CORS Errors
- Ensure frontend is running on localhost:3000
- Check CORS_ORIGIN in `backend/.env`

## 📊 Project Structure

```
BNB_PumpFun/
├── 📁 frontend/          # Next.js React application
│   ├── 📁 app/           # App router pages
│   ├── 📁 components/    # Reusable components
│   ├── 📁 lib/          # Utilities and configs
│   └── 📄 .env.local    # Frontend environment
├── 📁 backend/          # Express.js API server
│   ├── 📁 src/          # Source code
│   ├── 📁 prisma/       # Database schema
│   └── 📄 .env          # Backend environment
├── 📁 contracts/       # Smart contracts
└── 📄 start-local-dev.ps1  # Development script
```

## 🔄 Data Flow

```
Frontend (localhost:3000)
    ↕ HTTP API calls
Backend (localhost:3001)
    ↕ Database queries
Live PostgreSQL (Render)
    ↕ Real-time updates
Live Redis (Render)
    ↕ Blockchain queries
BSC Testnet
```

## 🎯 Available Features

### ✅ Working Locally
- Token creation and trading
- Real-time price updates
- Live transaction history
- User portfolios
- Comments system
- Favorites/Watchlist
- TradingView charts
- WebSocket connections

### ✅ Live Data Sources
- PostgreSQL database
- Redis caching
- BSC Testnet blockchain
- IPFS (Pinata)

## 🚨 Important Notes

### Security
- **Never commit .env files** with real secrets
- Local development uses **production database**
- Be careful with data modifications
- Test destructive operations on separate tokens

### Performance
- Hot reload may be slower with large datasets
- Database queries hit live production data
- Redis caching improves response times

### Deployment
- Changes tested locally work in production
- Same database and blockchain used
- Environment variables may differ for production builds

## 📞 Support

### If you encounter issues:

1. **Clean restart**: `.\start-local-dev.ps1 -Clean`
2. **Check logs**: Look at console output for errors
3. **Verify environment**: Ensure all .env variables are set
4. **Test connections**: Visit health check endpoint
5. **Database issues**: Check Render dashboard

### Useful Commands
```bash
# Check running processes
Get-Process node
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Reset everything
.\start-local-dev.ps1 -Clean
```

---

## 🎉 You're Ready!

Your local development environment is configured to:
- ✅ Run frontend and backend locally
- ✅ Connect to live production database
- ✅ Use real blockchain data
- ✅ Support hot reloading and debugging
- ✅ Maintain data consistency with production

Happy coding! 🚀