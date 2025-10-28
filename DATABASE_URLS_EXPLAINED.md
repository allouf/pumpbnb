# Database URLs - Internal vs External

## Your Database URLs

### Internal URL (Use in Render services)
```
postgresql://pumpbnb_user:nB3rAtHIN9kxP9hSxOgpA9jTJBkXb3Nb@dpg-d3qk5vali9vc73cej0mg-a/pumpbnb
```

### External URL (Use from local machine or external services)
```
postgresql://pumpbnb_user:nB3rAtHIN9kxP9hSxOgpA9jTJBkXb3Nb@dpg-d3qk5vali9vc73cej0mg-a.oregon-postgres.render.com/pumpbnb
```

## Key Differences

| Aspect | Internal | External |
|--------|----------|----------|
| Hostname | `dpg-d3qk5vali9vc73cej0mg-a` | `dpg-d3qk5vali9vc73cej0mg-a.oregon-postgres.render.com` |
| SSL Mode | Not required | **Required** (`?sslmode=require`) |
| Speed | Faster (internal network) | Slower (internet) |
| Cost | Free (internal bandwidth) | Costs bandwidth |
| Access | Only from Render services | From anywhere (if IP allowed) |

## Current Configuration Issues

### Issue 1: External URL Missing SSL Parameter
Your external URL should include `?sslmode=require`:
```
postgresql://pumpbnb_user:nB3rAtHIN9kxP9hSxOgpA9jTJBkXb3Nb@dpg-d3qk5vali9vc73cej0mg-a.oregon-postgres.render.com/pumpbnb?sslmode=require
```

### Issue 2: Backend Using Wrong URL
Let's check which URL is configured in the backend environment.

## Correct Configuration

### For Render Backend Service
**Environment Variable on Render:**
```bash
DATABASE_URL=postgresql://pumpbnb_user:nB3rAtHIN9kxP9hSxOgpA9jTJBkXb3Nb@dpg-d3qk5vali9vc73cej0mg-a/pumpbnb
```
- Use **internal URL** (without `.oregon-postgres.render.com`)
- **No SSL required** (internal network is trusted)
- Faster and free bandwidth

### For Local Development (.env file)
```bash
DATABASE_URL=postgresql://pumpbnb_user:nB3rAtHIN9kxP9hSxOgpA9jTJBkXb3Nb@dpg-d3qk5vali9vc73cej0mg-a.oregon-postgres.render.com/pumpbnb?sslmode=require
```
- Use **external URL** (with `.oregon-postgres.render.com`)
- **SSL required** (`?sslmode=require`)
- Requires IP whitelisting (see below)

## IP Whitelisting for External Access

### Why You Can't Connect Locally
Render PostgreSQL restricts external access by default. You need to add your IP.

### How to Add Your IP
1. Get your public IP:
   ```powershell
   (Invoke-WebRequest -Uri "https://ifconfig.me/ip").Content.Trim()
   ```

2. Go to Render Dashboard:
   - https://dashboard.render.com/
   - Select your PostgreSQL database
   - Go to "Settings" tab
   - Find "Allowed IP Addresses"
   - Click "Add IP Address"
   - Enter your IP address
   - Click "Save"

3. Test connection:
   ```bash
   cd backend
   npx prisma db execute --stdin <<EOF
   SELECT version();
   EOF
   ```

### Dynamic IP Issue
If your IP changes frequently (home internet):
- Add `0.0.0.0/0` to allow all IPs (NOT RECOMMENDED for production)
- Or just use Render Shell to run database commands
- Or use a VPN with static IP

## Recommended Setup

### backend/.env (Local Development)
```bash
DATABASE_URL="postgresql://pumpbnb_user:nB3rAtHIN9kxP9hSxOgpA9jTJBkXb3Nb@dpg-d3qk5vali9vc73cej0mg-a.oregon-postgres.render.com/pumpbnb?sslmode=require"
```

### Render Environment Variables (Production)
```bash
DATABASE_URL=postgresql://pumpbnb_user:nB3rAtHIN9kxP9hSxOgpA9jTJBkXb3Nb@dpg-d3qk5vali9vc73cej0mg-a/pumpbnb
```

### How to Update Render Environment Variable
1. Go to https://dashboard.render.com/
2. Click on "pumpbnb-backend" service
3. Go to "Environment" tab
4. Find `DATABASE_URL`
5. Update the value to the **internal URL** (without `.oregon-postgres.render.com`)
6. Click "Save Changes"
7. Service will auto-restart

## Testing Connection

### From Render Shell (Always Works)
```bash
psql $DATABASE_URL -c "SELECT version();"
```

### From Local Machine (Needs IP Whitelisting)
```powershell
# Windows - using psql if installed
$env:PGPASSWORD="nB3rAtHIN9kxP9hSxOgpA9jTJBkXb3Nb"
psql -h dpg-d3qk5vali9vc73cej0mg-a.oregon-postgres.render.com -U pumpbnb_user -d pumpbnb -c "SELECT version();"

# Or using Prisma
cd backend
npx prisma db execute --stdin <<EOF
SELECT version();
EOF
```

## Current Error Explanation

The database logs show:
```
[6900adde.554-4] ERROR: column tokens.address does not exist at character 32
```

This confirms:
- ✅ Backend CAN connect to database
- ✅ Database is running
- ✅ Tables exist (`tokens` table found)
- ❌ Schema is incomplete (missing `address` column)

**Solution**: Run `prisma db push` to sync the schema (see UPDATE_RENDER_START_COMMAND.md)

## Quick Verification Checklist

- [ ] Render backend uses internal URL (no `.oregon-postgres.render.com`)
- [ ] Local .env uses external URL (with `.oregon-postgres.render.com`)
- [ ] External URL includes `?sslmode=require`
- [ ] Your local IP is whitelisted (if testing locally)
- [ ] Start command includes `npx prisma db push` (temporary fix)

---

**Next Step**: Update Render start command to sync schema (see UPDATE_RENDER_START_COMMAND.md)
