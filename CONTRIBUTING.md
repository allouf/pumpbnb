# Contributing to PumpBNB

Thank you for your interest in contributing to PumpBNB! This document provides guidelines for contributing to the project.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Git
- BNB Chain wallet (MetaMask, Trust Wallet, etc.)
- Basic knowledge of Solidity, TypeScript, and React

### Development Setup

```bash
# Clone the repository
git clone https://bitbucket.org/allouf/pumpbnb.git
cd pumpbnb

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Run tests
npm test

# Start development server
npm run dev
```

## 📋 How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://bitbucket.org/allouf/pumpbnb/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots (if applicable)
   - Your environment details

### Suggesting Features

1. Check existing feature requests
2. Create a new issue with:
   - Clear use case
   - Expected behavior
   - Why this feature would benefit users
   - Mockups or examples (if applicable)

### Pull Request Process

1. **Fork the repository** and create your branch from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the code style guidelines
   - Add tests for new features
   - Update documentation as needed

3. **Test your changes**
   ```bash
   npm test
   npm run lint
   npm run type-check
   ```

4. **Commit your changes**
   - Use clear, descriptive commit messages
   - Follow conventional commits format:
     ```
     feat: add bonding curve calculator
     fix: resolve wallet connection issue
     docs: update API documentation
     test: add tests for token creation
     ```

5. **Push to your fork** and submit a pull request
   ```bash
   git push origin feature/your-feature-name
   ```

6. **PR Requirements**:
   - Description of changes
   - Related issue number
   - Screenshots (for UI changes)
   - Test coverage maintained or improved
   - Documentation updated

## 🎨 Code Style Guidelines

### Solidity (Smart Contracts)

```solidity
// Use natspec documentation
/// @notice Deploys a new meme token
/// @param name Token name
/// @param symbol Token symbol
/// @return tokenAddress Address of deployed token
function createToken(
    string memory name,
    string memory symbol
) external returns (address tokenAddress) {
    // Implementation
}

// Follow Solidity style guide
// Use explicit visibility
// Order: external, public, internal, private
```

### TypeScript/JavaScript

```typescript
// Use TypeScript strict mode
// Prefer const over let
// Use async/await over promises
// Follow ESLint rules

// Good
const fetchTokenData = async (address: string): Promise<TokenData> => {
  const response = await api.getToken(address);
  return response.data;
};

// Avoid
function fetchTokenData(address) {
  return api.getToken(address).then(r => r.data);
}
```

### React Components

```tsx
// Use functional components with hooks
// Props with TypeScript interfaces
// Descriptive names

interface TokenCardProps {
  address: string;
  name: string;
  price: number;
}

export const TokenCard: React.FC<TokenCardProps> = ({
  address,
  name,
  price
}) => {
  // Implementation
};
```

## 🧪 Testing Guidelines

### Smart Contracts

```typescript
describe("TokenFactory", () => {
  it("should deploy token with correct parameters", async () => {
    const { factory } = await loadFixture(deployFactoryFixture);
    const tx = await factory.createToken("Test", "TEST", metadata);
    expect(tx).to.emit(factory, "TokenCreated");
  });
});
```

### Frontend

```typescript
describe("TokenCard", () => {
  it("renders token information correctly", () => {
    render(<TokenCard {...mockTokenData} />);
    expect(screen.getByText("Test Token")).toBeInTheDocument();
  });
});
```

## 📁 Project Structure

```
pumpbnb/
├── contracts/          # Smart contracts
│   ├── TokenFactory.sol
│   ├── BondingCurve.sol
│   └── tests/
├── frontend/           # Next.js application
│   ├── app/
│   ├── components/
│   └── lib/
├── backend/            # Node.js API
│   ├── src/
│   └── tests/
├── mobile/             # React Native app
├── docs/               # Documentation
└── agent-os/           # Product specifications
```

## 🔐 Security

### Reporting Security Issues

**DO NOT** create public issues for security vulnerabilities.

Instead:
1. Email security@pumpbnb.com (when available)
2. Include detailed description
3. Steps to reproduce
4. Potential impact
5. Suggested fix (if any)

We will respond within 48 hours.

### Security Best Practices

- Never commit private keys or secrets
- Use `.env` for sensitive data
- Run security linters before committing
- Follow smart contract security patterns
- Implement proper access controls

## 📝 Documentation

### Code Documentation

- Add JSDoc/TSDoc for all public functions
- Include examples in documentation
- Keep README.md up to date
- Document breaking changes

### Feature Documentation

When adding new features:
1. Update feature specification in `agent-os/features/`
2. Add to feature list in `agent-os/product/feature-list.md`
3. Update roadmap if needed
4. Add user guide to `docs/`

## 🏅 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Eligible for contributor NFTs (future)
- Invited to private Discord channel

## 📞 Getting Help

- Discord: [Join our Discord](#)
- Telegram: [Join our Telegram](#)
- Email: dev@pumpbnb.com (when available)

## 📜 Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone.

### Our Standards

**Positive behavior:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what's best for the community

**Unacceptable behavior:**
- Trolling, insulting/derogatory comments
- Public or private harassment
- Publishing others' private information
- Other conduct inappropriate in a professional setting

### Enforcement

Violations may result in:
1. Warning
2. Temporary ban
3. Permanent ban

Report violations to conduct@pumpbnb.com

## 📅 Development Cycle

### Sprint Structure
- 2-week sprints
- Sprint planning every Monday
- Daily standups (async via Discord)
- Sprint review and retrospective

### Release Schedule
- Major releases: Monthly
- Minor releases: Bi-weekly
- Patches: As needed

## ✅ Checklist Before Submitting PR

- [ ] Code follows project style guidelines
- [ ] Self-review of code completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added and passing
- [ ] Dependent changes merged
- [ ] PR description is clear

## 🎯 Priority Labels

- `P0: Critical` - Security issues, showstopper bugs
- `P1: High` - Major features, important bugs
- `P2: Medium` - Nice-to-have features, minor bugs
- `P3: Low` - Cosmetic changes, documentation

## 🌟 Thank You!

Every contribution matters, whether it's:
- Code contributions
- Bug reports
- Feature suggestions
- Documentation improvements
- Community support

Together, we're building the future of meme coin launches on BNB Chain! 🚀
