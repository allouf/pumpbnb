# F2: Token Creation System

**Feature ID**: F2
**Priority**: Critical (Must-Have)
**Phase**: 1 - Core Platform (MVP)
**Dependencies**: F1 (Wallet Connection)
**Status**: Specification

---

## Overview

One-click BEP-20 token deployment system that enables anyone to create a meme coin on BNB Chain without coding knowledge. Tokens are deployed with standardized parameters, metadata stored on IPFS, and immediately tradable on the bonding curve.

### User Value
- **Zero Technical Barriers**: Create tokens without coding
- **Instant Deployment**: Token live in ~5 seconds
- **Cost-Effective**: ~$0.041 total gas cost vs $3.50-$8 on Solana
- **Fair Launch**: No presales, equal opportunity for all traders
- **Professional Metadata**: IPFS-hosted token information

---

## User Stories

### As a token creator
- I want to create a token with just a name, symbol, and image
- I want my token to be tradable immediately after creation
- I want to receive 20% of the token supply as creator allocation (locked during bonding curve)
- I want my token's metadata to be permanently stored and accessible

### As a platform user
- I want to see newly created tokens appear in the feed within seconds
- I want to verify token metadata (image, description) before trading
- I want confidence that all tokens follow the same standard

---

## Technical Requirements

### Smart Contract: TokenFactory.sol

#### Contract Purpose
Factory pattern for deploying standardized BEP-20 tokens with bonding curve integration.

#### Core Functions

```solidity
contract TokenFactory {
    // Deploy new token
    function createToken(
        string memory name,
        string memory symbol,
        string memory metadataURI,
        address creator
    ) external payable returns (address tokenAddress);

    // Get all tokens created by address
    function getTokensByCreator(address creator)
        external view returns (address[] memory);

    // Get total tokens created
    function getTotalTokens() external view returns (uint256);

    // Fee collection
    uint256 public constant CREATION_FEE = 0.0001 ether; // ~$0.10
}
```

#### Token Standard Features
```solidity
contract MemeToken is ERC20, Ownable {
    string public metadataURI;        // IPFS URI
    address public creator;           // Creator address
    uint256 public createdAt;         // Timestamp
    address public bondingCurve;      // Bonding curve contract
    bool public graduated;            // PancakeSwap migration status

    // Initial supply: 1,000,000,000 tokens
    // Creator allocation: 200,000,000 (20%, locked)
    // Bonding curve allocation: 800,000,000 (80%)
}
```

### Gas Cost Analysis
| Operation | Gas Units | Cost (5 Gwei) | Notes |
|-----------|-----------|---------------|-------|
| **Token Deploy** | ~3,200,000 | $0.041 | Includes BondingCurve creation |
| **IPFS Upload** | Off-chain | $0.001 | Via Pinata API |
| **Total** | - | **$0.042** | 95% cheaper than Solana |

### IPFS Metadata Structure

```json
{
  "name": "Doge Killer",
  "symbol": "DOGK",
  "description": "The next generation of meme coins",
  "image": "ipfs://Qm...",
  "creator": "0x742d35Cc6634C0532925a3b844Bc9e7595f4e89",
  "website": "https://dogekiller.com",
  "twitter": "@dogekiller",
  "telegram": "https://t.me/dogekiller",
  "createdAt": "2025-10-10T12:00:00Z",
  "totalSupply": "1000000000",
  "creatorAllocation": "200000000"
}
```

---

## User Experience Flow

### Token Creation Flow (5 Steps)

```
Step 1: Connect Wallet
   ↓
Step 2: Fill Token Details
   - Name (e.g., "Doge Killer")
   - Symbol (e.g., "DOGK", 3-6 characters)
   - Description (max 500 characters)
   - Upload Image (max 2MB, PNG/JPG)
   - [Optional] Website, Twitter, Telegram
   ↓
Step 3: Preview & Review
   - Show all details
   - Display fee breakdown ($0.10 creation + $0.041 gas)
   - Terms of service checkbox
   ↓
Step 4: Confirm Transaction
   - Upload image to IPFS
   - Upload metadata to IPFS
   - Deploy token contract
   - User approves in wallet
   ↓
Step 5: Success!
   - Show token contract address
   - Show bonding curve trading link
   - Share on social media
   - Redirect to token page
```

### Form Validation

| Field | Validation Rules |
|-------|------------------|
| **Name** | 3-50 characters, alphanumeric + spaces |
| **Symbol** | 3-6 characters, uppercase letters only |
| **Description** | 0-500 characters |
| **Image** | PNG/JPG, max 2MB, min 300x300px, recommended 1000x1000px |
| **Website** | Valid URL format (optional) |
| **Social Links** | Valid URL/handle format (optional) |

---

## UI Components

### Create Token Page

**Layout:**
```
┌─────────────────────────────────────┐
│  Create Your Token                  │
├─────────────────────────────────────┤
│  [Upload Image] ←                   │
│                  ↑ Drag & drop area │
│                                      │
│  Token Name:     [____________]     │
│  Token Symbol:   [______]           │
│                                      │
│  Description:                        │
│  [____________________________]     │
│  [____________________________]     │
│  [____________________________]     │
│                                      │
│  Website (optional): [__________]   │
│  Twitter (optional): [__________]   │
│  Telegram (optional): [_________]   │
│                                      │
│  [✓] I agree to Terms of Service    │
│                                      │
│  Fee: $0.151 (0.10 + $0.041 gas)    │
│                                      │
│  [      Create Token ($0.151)     ] │
└─────────────────────────────────────┘
```

### Image Upload Component
- Drag-and-drop area
- File picker button
- Image preview
- Crop/resize tool
- Format/size validation
- IPFS upload progress bar

### Success Modal
```
✓ Token Created Successfully!

Your token "Doge Killer" ($DOGK) is now live!

Contract: 0x1234...5678
Bonding Curve: 0xabcd...ef01

[View Token Page]  [Share on X]  [Create Another]
```

---

## Backend Implementation

### API Endpoints

```typescript
// Upload image to IPFS
POST /api/ipfs/upload-image
Request: FormData with image file
Response: { ipfsHash: "Qm...", url: "ipfs://..." }

// Upload metadata to IPFS
POST /api/ipfs/upload-metadata
Request: { name, symbol, description, imageHash, ... }
Response: { ipfsHash: "Qm...", url: "ipfs://..." }

// Create token (triggers smart contract)
POST /api/tokens/create
Request: {
  metadataURI: "ipfs://...",
  signature: "0x..."
}
Response: {
  tokenAddress: "0x...",
  transactionHash: "0x...",
  bondingCurveAddress: "0x..."
}

// Get token info
GET /api/tokens/:address
Response: Token details from blockchain + IPFS
```

### Database Schema

```sql
CREATE TABLE tokens (
  id SERIAL PRIMARY KEY,
  address VARCHAR(42) UNIQUE NOT NULL,
  name VARCHAR(50) NOT NULL,
  symbol VARCHAR(6) NOT NULL,
  metadata_uri TEXT NOT NULL,
  creator_address VARCHAR(42) NOT NULL,
  bonding_curve_address VARCHAR(42) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  graduated BOOLEAN DEFAULT FALSE,
  graduation_tx VARCHAR(66),
  total_supply NUMERIC(78,0),
  creator_allocation NUMERIC(78,0)
);

CREATE INDEX idx_tokens_creator ON tokens(creator_address);
CREATE INDEX idx_tokens_created_at ON tokens(created_at DESC);
```

---

## Smart Contract Security

### Anti-Bot Protection

```solidity
// Prevent contract creation spam
mapping(address => uint256) public lastCreationTime;
uint256 public constant CREATION_COOLDOWN = 5 minutes;

modifier antiSpam() {
    require(
        block.timestamp >= lastCreationTime[msg.sender] + CREATION_COOLDOWN,
        "Must wait 5 minutes between token creations"
    );
    lastCreationTime[msg.sender] = block.timestamp;
    _;
}
```

### Creator Allocation Lock

```solidity
// Creator tokens locked until graduation
mapping(address => uint256) public lockedBalances;

function _transfer(address from, address to, uint256 amount)
    internal virtual override {
    if (from == creator && !graduated) {
        require(
            balanceOf(from) - amount >= lockedBalances[from],
            "Creator allocation locked until graduation"
        );
    }
    super._transfer(from, to, amount);
}
```

### Access Controls

```solidity
// Only factory can deploy tokens
modifier onlyFactory() {
    require(msg.sender == factory, "Only factory");
    _;
}

// Only bonding curve can graduate token
modifier onlyBondingCurve() {
    require(msg.sender == bondingCurve, "Only bonding curve");
    _;
}

function graduate() external onlyBondingCurve {
    graduated = true;
    emit TokenGraduated(block.timestamp);
}
```

---

## Acceptance Criteria

### Must Have
- [ ] User can create token in ≤ 5 minutes
- [ ] Token deploys with correct parameters (1B supply, 20% creator allocation)
- [ ] Image uploads to IPFS successfully
- [ ] Metadata uploads to IPFS successfully
- [ ] Token is immediately tradable on bonding curve
- [ ] Creator receives 200M tokens (locked)
- [ ] Gas cost is < $0.05
- [ ] Creation fee ($0.10) goes to platform treasury
- [ ] Token appears in discovery feed within 10 seconds
- [ ] All form fields validate correctly

### Should Have
- [ ] Image auto-resizes to recommended dimensions
- [ ] Preview shows how token will look in feed
- [ ] Social media share buttons work
- [ ] Creator can edit metadata (within 24 hours)
- [ ] Duplicate name/symbol warning

### Nice to Have
- [ ] AI-generated token descriptions
- [ ] Template images for quick creation
- [ ] Token creation tutorial video
- [ ] Batch token creation (for advanced users)

---

## Testing Requirements

### Smart Contract Tests
- [ ] Token deploys with correct supply
- [ ] Creator allocation is locked
- [ ] Creation fee transfers correctly
- [ ] Anti-spam cooldown works
- [ ] Only factory can deploy tokens
- [ ] Gas optimization verified

### Integration Tests
- [ ] IPFS upload succeeds
- [ ] Metadata retrieval works
- [ ] Token creation end-to-end
- [ ] Database sync with blockchain
- [ ] Error handling for failed uploads

### UI Tests
- [ ] Form validation works
- [ ] Image upload flow
- [ ] Transaction confirmation
- [ ] Success/error states
- [ ] Mobile responsiveness

---

## Performance Requirements

| Metric | Target | Notes |
|--------|--------|-------|
| **IPFS Upload Time** | < 2 seconds | Image + metadata |
| **Smart Contract Deploy** | < 5 seconds | BSC block time |
| **Total Creation Time** | < 10 seconds | From submit to tradable |
| **Image Processing** | < 1 second | Resize/optimize |

---

## Security Considerations

### Image Upload Security
- Validate file types (PNG, JPG only)
- Scan for malware
- Limit file size (2MB max)
- Strip EXIF data
- Content-type verification

### Metadata Security
- Sanitize all text inputs (prevent XSS)
- URL validation for links
- Rate limiting on API endpoints
- IPFS pinning to prevent data loss

### Smart Contract Security
- Reentrancy protection
- Integer overflow protection (Solidity 0.8+)
- Access control on sensitive functions
- Emergency pause mechanism
- Audit by 2 independent firms

---

## Implementation Checklist

### Week 1: Smart Contract Development
- [ ] Write TokenFactory.sol
- [ ] Write MemeToken.sol template
- [ ] Implement creator allocation lock
- [ ] Add anti-spam protection
- [ ] Unit tests for contracts

### Week 2: IPFS Integration
- [ ] Set up Pinata account
- [ ] Build image upload API
- [ ] Build metadata upload API
- [ ] Test IPFS pinning
- [ ] Backup IPFS gateway

### Week 3: Frontend Development
- [ ] Create token creation form
- [ ] Image upload component
- [ ] Form validation
- [ ] Transaction flow UI
- [ ] Success/error handling

### Week 4: Integration & Testing
- [ ] Connect frontend to contracts
- [ ] End-to-end testing
- [ ] Gas optimization
- [ ] Security review
- [ ] User acceptance testing

---

## Dependencies for Other Features

**This feature enables:**
- F3 (Bonding Curve Trading) - tokens must exist to be traded
- F4 (Token Discovery) - tokens populate the feed
- F6 (PancakeSwap Graduation) - tokens can graduate

---

## Open Questions

- [ ] Should we support token edits after creation?
- [ ] Do we need moderation for offensive content?
- [ ] Should we charge higher fees for premium features (verified badge)?
- [ ] Do we need IPFS backup to Arweave for permanence?

---

## Success Metrics

- **Token Creation Success Rate**: > 99%
- **Average Creation Time**: < 10 seconds
- **IPFS Upload Success**: > 99.5%
- **Gas Cost**: < $0.05 per token
- **Tokens Created per Day**: Target 100+ (Month 1)

---

**Next Steps**: Review specification, then begin smart contract development.
