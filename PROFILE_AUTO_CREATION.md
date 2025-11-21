# Auto-Profile Creation Feature (Like Pump.fun)

## Overview
Implemented automatic user profile creation similar to Pump.fun's behavior. When a user first interacts with the platform (e.g., commenting, trading, creating tokens), a profile is automatically created with a default username derived from their wallet address.

## How It Works

### Username Generation
Like Pump.fun, usernames are auto-generated from wallet addresses:
- **Format**: First 6 characters after "0x" prefix
- **Example**:
  - Wallet: `0x5f9ce34bb4909088bf2d3629249f2efa0d6a9f94`
  - Username: `5f9ce3`
  - Profile URL: `/profile/0x5f9ce34bb4909088bf2d3629249f2efa0d6a9f94`

This matches Pump.fun's approach where:
- Solana address: `4KgovyGs1De3BHGBWPZN1fH347MF32AUmv1VRH1wvjNS`
- Username: `4kgovy`
- Profile URL: `https://pump.fun/profile/4kgovy`

### When Profiles Are Created
User profiles are automatically created when:

1. **Authentication** - User signs in with wallet (`/api/auth/verify`)
2. **Profile Access** - Someone visits a user's profile page (`/api/profile/:address`)
3. **Commenting** - User posts a comment (`/api/v2/tokens/:address/comments`)
4. **Any Future Interaction** - Easy to add to other endpoints

### Profile Features
Each auto-created profile includes:
- ✅ Wallet address (normalized to lowercase)
- ✅ Auto-generated username (editable once per day)
- ✅ Created tokens count (automatically calculated)
- ✅ Followers/following counts (initially 0)
- ✅ Profile image support (optional)
- ✅ Bio (optional)

## Implementation Files

### Backend Changes

#### 1. **`backend/src/utils/autoCreateUser.ts`** (NEW)
Utility function to ensure user profiles exist:
```typescript
export async function ensureUserExists(walletAddress: string)
```
- Checks if user exists
- Creates profile with auto-generated username if not
- Calculates created tokens count
- Returns user object

#### 2. **`backend/src/routes/auth.routes.ts`** (UPDATED)
```typescript
// Lines 136-144: Updated username generation
const defaultUsername = walletAddress.slice(2, 8).toLowerCase();
```
Changed from `slice(0, 6)` to `slice(2, 8)` to skip "0x" prefix.

#### 3. **`backend/src/routes/profile.routes.ts`** (UPDATED)
```typescript
// Line 17: Auto-create on profile access
const user = await ensureUserExists(address);
```
Now creates profiles automatically when accessed.

#### 4. **`backend/src/controllers/comments.controller.ts`** (UPDATED)
```typescript
// Line 166: Auto-create when commenting
await ensureUserExists(userAddress);
```
Creates profile before saving comment.

### Frontend Changes

#### 5. **`frontend/components/CommentsSection.tsx`** (UPDATED)
- Shows user profile images in comments
- Displays username instead of truncated address
- Clicking avatar/username navigates to profile page
- Hover effects for better UX

## Database Schema
The User model (already existed, no changes needed):
```prisma
model User {
  id                  String   @id @default(uuid())
  walletAddress       String   @unique
  username            String?  @unique
  bio                 String?
  profileImage        String?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  lastUsernameChange  DateTime?
  followersCount      Int      @default(0)
  followingCount      Int      @default(0)
  createdTokensCount  Int      @default(0)
}
```

## Example Flow

### Scenario: User `0x5f9ce34bb4909088bf2d3629249f2efa0d6a9f94` posts a comment

1. **Comment Request**
   ```
   POST /api/v2/tokens/0xtoken123/comments
   Body: { userAddress: "0x5f9ce34bb4909088bf2d3629249f2efa0d6a9f94", content: "Great token!" }
   ```

2. **Auto-Profile Creation**
   - System checks: Does user exist? → No
   - Generates username: `5f9ce3`
   - Counts tokens created: 0
   - Creates user profile
   - Saves comment

3. **Profile Created**
   ```json
   {
     "walletAddress": "0x5f9ce34bb4909088bf2d3629249f2efa0d6a9f94",
     "username": "5f9ce3",
     "bio": null,
     "profileImage": null,
     "followersCount": 0,
     "followingCount": 0,
     "createdTokensCount": 0
   }
   ```

4. **Profile Now Accessible**
   - Direct URL: `/profile/0x5f9ce34bb4909088bf2d3629249f2efa0d6a9f94`
   - Shows username: `5f9ce3`
   - User can edit profile to change username (once per day)

## Testing

### Manual Test Steps

1. **Test Address**: `0x5f9ce34bb4909088bf2d3629249f2efa0d6a9f94`

2. **Verify Profile Creation**:
   ```bash
   # Visit profile page
   curl https://pumpbnb-backend.onrender.com/api/profile/0x5f9ce34bb4909088bf2d3629249f2efa0d6a9f94
   ```
   Expected: Profile auto-created with username "5f9ce3"

3. **Post a Comment** (triggers auto-creation if not exists):
   ```bash
   curl -X POST https://pumpbnb-backend.onrender.com/api/v2/tokens/{tokenAddress}/comments \
     -H "Content-Type: application/json" \
     -d '{"userAddress":"0x5f9ce34bb4909088bf2d3629249f2efa0d6a9f94","content":"Test"}'
   ```

4. **Check Comments Show Profile**:
   - Navigate to token page
   - View comments section
   - Should show profile image (if uploaded) or default icon
   - Clicking username navigates to profile page

## Future Enhancements

### 1. Username Uniqueness
Currently, if two addresses start with same 6 chars, we could have conflicts. Consider:
- Append a number: `5f9ce3`, `5f9ce3-2`, etc.
- Use longer prefix for conflicts

### 2. Balances Tab (Like Pump.fun)
Add `/profile/:address?tab=balances` to show:
- All token holdings
- Market cap of each token
- Total value in USD

### 3. Notification Tab
Track notifications for:
- New followers
- Comments on user's tokens
- Mentions in comments

### 4. Profile Stats
Show additional stats:
- Total trading volume
- Most profitable token
- Win rate

## Comparison with Pump.fun

| Feature | Pump.fun | PumpBNB | Status |
|---------|----------|---------|--------|
| Auto-profile creation | ✅ | ✅ | Implemented |
| Auto-generated username | ✅ | ✅ | Implemented |
| Profile images | ✅ | ✅ | Implemented |
| Username in comments | ✅ | ✅ | Implemented |
| Clickable profile links | ✅ | ✅ | Implemented |
| Balances tab | ✅ | ⏳ | Planned |
| Replies tab | ✅ | ⏳ | Planned |
| Notifications tab | ✅ | ⏳ | Planned |

## Notes

- All wallet addresses are stored in lowercase for consistency
- Usernames are generated in lowercase
- Username can be changed once per day after creation
- Profile images stored as URLs (IPFS or direct upload)
- No authentication required to view profiles (public by default)
