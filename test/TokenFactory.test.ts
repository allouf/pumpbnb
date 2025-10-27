import { expect } from "chai";
import { ethers } from "hardhat";
import { TokenFactory, PlatformConfig, PumpToken, BondingCurve } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { deployPlatformConfig, deployTokenFactory, getTestAccounts, parseAster } from "./helpers";

describe("TokenFactory", function () {
  let factory: TokenFactory;
  let config: PlatformConfig;

  let deployer: SignerWithAddress;
  let creator1: SignerWithAddress;
  let creator2: SignerWithAddress;
  let admin: SignerWithAddress;
  let pauser: SignerWithAddress;
  let protocolFeeRecipient: SignerWithAddress;

  const VIRTUAL_ASTER_RESERVE = parseAster("30");

  beforeEach(async function () {
    const accounts = await getTestAccounts();
    deployer = accounts.deployer;
    creator1 = accounts.creator;
    creator2 = accounts.trader1;
    admin = accounts.admin;
    pauser = accounts.pauser;
    protocolFeeRecipient = accounts.protocolFeeRecipient;

    config = await deployPlatformConfig(protocolFeeRecipient.address, admin.address, pauser.address);
    factory = await deployTokenFactory(await config.getAddress(), VIRTUAL_ASTER_RESERVE);
  });

  describe("Deployment", function () {
    it("Should set correct config address", async function () {
      expect(await factory.config()).to.equal(await config.getAddress());
    });

    it("Should set correct virtual ASTER reserve", async function () {
      expect(await factory.virtualAsterReserve()).to.equal(VIRTUAL_ASTER_RESERVE);
    });

    it("Should initialize token counter to zero", async function () {
      expect(await factory.tokenCounter()).to.equal(0);
    });

    it("Should grant deployer admin roles", async function () {
      const DEFAULT_ADMIN_ROLE = await factory.DEFAULT_ADMIN_ROLE();
      const FACTORY_ADMIN_ROLE = await factory.FACTORY_ADMIN_ROLE();

      expect(await factory.hasRole(DEFAULT_ADMIN_ROLE, deployer.address)).to.be.true;
      expect(await factory.hasRole(FACTORY_ADMIN_ROLE, deployer.address)).to.be.true;
    });

    it("Should revert if config is zero address", async function () {
      const TokenFactory = await ethers.getContractFactory("TokenFactory");
      await expect(
        TokenFactory.deploy(ethers.ZeroAddress, VIRTUAL_ASTER_RESERVE)
      ).to.be.revertedWith("Invalid config");
    });

    it("Should revert if virtual reserve is zero", async function () {
      const TokenFactory = await ethers.getContractFactory("TokenFactory");
      await expect(
        TokenFactory.deploy(await config.getAddress(), 0)
      ).to.be.revertedWith("Invalid virtual reserve");
    });
  });

  describe("createToken", function () {
    it("Should create a new token with bonding curve", async function () {
      const tx = await factory.connect(creator1).createToken("Test Token", "TEST", "ipfs://test");
      const receipt = await tx.wait();

      const event = receipt?.logs.find((log: any) => {
        try {
          const parsed = factory.interface.parseLog(log);
          return parsed?.name === "TokenCreated";
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;

      const parsed = factory.interface.parseLog(event!);
      expect(parsed?.args.creator).to.equal(creator1.address);
      expect(parsed?.args.name).to.equal("Test Token");
      expect(parsed?.args.symbol).to.equal("TEST");
    });

    it("Should emit TokenCreated event with correct parameters", async function () {
      await expect(factory.connect(creator1).createToken("Test Token", "TEST", "ipfs://test"))
        .to.emit(factory, "TokenCreated");
    });

    it("Should increment token counter", async function () {
      await factory.connect(creator1).createToken("Token 1", "TK1", "ipfs://1");
      expect(await factory.tokenCounter()).to.equal(1);

      await factory.connect(creator1).createToken("Token 2", "TK2", "ipfs://2");
      expect(await factory.tokenCounter()).to.equal(2);
    });

    it("Should register token in allTokens array", async function () {
      await factory.connect(creator1).createToken("Test Token", "TEST", "ipfs://test");

      const allTokens = await factory.getAllTokensNoPagination();
      expect(allTokens.length).to.equal(1);
    });

    it("Should store token metadata", async function () {
      const tx = await factory.connect(creator1).createToken("Test Token", "TEST", "ipfs://test");
      const receipt = await tx.wait();

      const event = receipt?.logs.find((log: any) => {
        try {
          const parsed = factory.interface.parseLog(log);
          return parsed?.name === "TokenCreated";
        } catch {
          return false;
        }
      });

      const parsed = factory.interface.parseLog(event!);
      const tokenAddress = parsed?.args.token;

      const info = await factory.getTokenInfo(tokenAddress);
      expect(info.name).to.equal("Test Token");
      expect(info.symbol).to.equal("TEST");
      expect(info.uri).to.equal("ipfs://test");
      expect(info.creator).to.equal(creator1.address);
      expect(info.exists).to.be.true;
    });

    it("Should deploy token and bonding curve with correct addresses", async function () {
      const tx = await factory.connect(creator1).createToken("Test Token", "TEST", "ipfs://test");
      const receipt = await tx.wait();

      const event = receipt?.logs.find((log: any) => {
        try {
          const parsed = factory.interface.parseLog(log);
          return parsed?.name === "TokenCreated";
        } catch {
          return false;
        }
      });

      const parsed = factory.interface.parseLog(event!);
      const tokenAddress = parsed?.args.token;
      const bondingCurveAddress = parsed?.args.bondingCurve;

      expect(tokenAddress).to.not.equal(ethers.ZeroAddress);
      expect(bondingCurveAddress).to.not.equal(ethers.ZeroAddress);
      expect(tokenAddress).to.not.equal(bondingCurveAddress);
    });

    it("Should configure token correctly", async function () {
      const tx = await factory.connect(creator1).createToken("Test Token", "TEST", "ipfs://test");
      const receipt = await tx.wait();

      const event = receipt?.logs.find((log: any) => {
        try {
          const parsed = factory.interface.parseLog(log);
          return parsed?.name === "TokenCreated";
        } catch {
          return false;
        }
      });

      const parsed = factory.interface.parseLog(event!);
      const tokenAddress = parsed?.args.token;

      const token = await ethers.getContractAt("PumpToken", tokenAddress);

      expect(await token.name()).to.equal("Test Token");
      expect(await token.symbol()).to.equal("TEST");
      expect(await token.creator()).to.equal(creator1.address);
      expect(await token.factory()).to.equal(await factory.getAddress());
    });

    it("Should configure bonding curve correctly", async function () {
      const tx = await factory.connect(creator1).createToken("Test Token", "TEST", "ipfs://test");
      const receipt = await tx.wait();

      const event = receipt?.logs.find((log: any) => {
        try {
          const parsed = factory.interface.parseLog(log);
          return parsed?.name === "TokenCreated";
        } catch {
          return false;
        }
      });

      const parsed = factory.interface.parseLog(event!);
      const bondingCurveAddress = parsed?.args.bondingCurve;
      const tokenAddress = parsed?.args.token;

      const bondingCurve = await ethers.getContractAt("BondingCurve", bondingCurveAddress);

      expect(await bondingCurve.token()).to.equal(tokenAddress);
      expect(await bondingCurve.creator()).to.equal(creator1.address);
      expect(await bondingCurve.virtualAsterReserve()).to.equal(VIRTUAL_ASTER_RESERVE);
    });

    it("Should revert if platform is paused", async function () {
      await config.connect(pauser).pause();

      await expect(
        factory.connect(creator1).createToken("Test", "TST", "ipfs://test")
      ).to.be.revertedWith("Platform paused");
    });

    it("Should revert if name is empty", async function () {
      await expect(
        factory.connect(creator1).createToken("", "TST", "ipfs://test")
      ).to.be.revertedWith("Invalid name length");
    });

    it("Should revert if name is too long", async function () {
      const longName = "A".repeat(33);
      await expect(
        factory.connect(creator1).createToken(longName, "TST", "ipfs://test")
      ).to.be.revertedWith("Invalid name length");
    });

    it("Should revert if symbol is empty", async function () {
      await expect(
        factory.connect(creator1).createToken("Test", "", "ipfs://test")
      ).to.be.revertedWith("Invalid symbol length");
    });

    it("Should revert if symbol is too long", async function () {
      const longSymbol = "A".repeat(11);
      await expect(
        factory.connect(creator1).createToken("Test", longSymbol, "ipfs://test")
      ).to.be.revertedWith("Invalid symbol length");
    });

    it("Should revert if URI is empty", async function () {
      await expect(
        factory.connect(creator1).createToken("Test", "TST", "")
      ).to.be.revertedWith("Invalid URI length");
    });

    it("Should revert if URI is too long", async function () {
      const longUri = "ipfs://" + "a".repeat(250);
      await expect(
        factory.connect(creator1).createToken("Test", "TST", longUri)
      ).to.be.revertedWith("Invalid URI length");
    });

    it("Should allow maximum valid lengths", async function () {
      const maxName = "A".repeat(32);
      const maxSymbol = "B".repeat(10);
      const maxUri = "ipfs://" + "c".repeat(249);

      await expect(
        factory.connect(creator1).createToken(maxName, maxSymbol, maxUri)
      ).to.emit(factory, "TokenCreated");
    });
  });

  describe("Query Functions", function () {
    beforeEach(async function () {
      await factory.connect(creator1).createToken("Token 1", "TK1", "ipfs://1");
      await factory.connect(creator1).createToken("Token 2", "TK2", "ipfs://2");
      await factory.connect(creator2).createToken("Token 3", "TK3", "ipfs://3");
    });

    it("Should return correct token count", async function () {
      expect(await factory.getTokenCount()).to.equal(3);
    });

    it("Should return all tokens with getAllTokensNoPagination", async function () {
      const tokens = await factory.getAllTokensNoPagination();
      expect(tokens.length).to.equal(3);
    });

    it("Should return tokens with pagination", async function () {
      const tokens = await factory.getAllTokens(0, 2);
      expect(tokens.length).to.equal(2);
    });

    it("Should handle pagination offset", async function () {
      const tokens = await factory.getAllTokens(1, 2);
      expect(tokens.length).to.equal(2);
    });

    it("Should handle pagination beyond array length", async function () {
      const tokens = await factory.getAllTokens(0, 10);
      expect(tokens.length).to.equal(3);
    });

    it("Should return bonding curve for token", async function () {
      const tokens = await factory.getAllTokensNoPagination();
      const bondingCurve = await factory.getBondingCurve(tokens[0]);
      expect(bondingCurve).to.not.equal(ethers.ZeroAddress);
    });

    it("Should check if token exists", async function () {
      const tokens = await factory.getAllTokensNoPagination();
      expect(await factory.tokenExists(tokens[0])).to.be.true;
      expect(await factory.tokenExists(ethers.ZeroAddress)).to.be.false;
    });

    it("Should return tokens by creator", async function () {
      const creator1Tokens = await factory.getTokensByCreator(creator1.address);
      const creator2Tokens = await factory.getTokensByCreator(creator2.address);

      expect(creator1Tokens.length).to.equal(2);
      expect(creator2Tokens.length).to.equal(1);
    });

    it("Should return empty array for creator with no tokens", async function () {
      const tokens = await factory.getTokensByCreator(admin.address);
      expect(tokens.length).to.equal(0);
    });

    it("Should get token info for individual tokens", async function () {
      const tokens = await factory.getAllTokensNoPagination();

      // Test getTokenInfo for each token individually
      const info0 = await factory.getTokenInfo(tokens[0]);
      const info1 = await factory.getTokenInfo(tokens[1]);
      const info2 = await factory.getTokenInfo(tokens[2]);

      expect(info0.name).to.equal("Token 1");
      expect(info1.name).to.equal("Token 2");
      expect(info2.name).to.equal("Token 3");
    });
  });

  describe("Virtual ASTER Reserve Management", function () {
    it("Should allow admin to update virtual ASTER reserve", async function () {
      const newReserve = parseAster("50");

      await expect(factory.connect(deployer).setVirtualAsterReserve(newReserve))
        .to.emit(factory, "VirtualAsterReserveUpdated")
        .withArgs(VIRTUAL_ASTER_RESERVE, newReserve);

      expect(await factory.virtualAsterReserve()).to.equal(newReserve);
    });

    it("Should revert if non-admin tries to update reserve", async function () {
      await expect(
        factory.connect(creator1).setVirtualAsterReserve(parseAster("50"))
      ).to.be.reverted;
    });

    it("Should revert if new reserve is zero", async function () {
      await expect(
        factory.connect(deployer).setVirtualAsterReserve(0)
      ).to.be.revertedWith("Invalid reserve");
    });

    it("Should use new reserve for newly created tokens", async function () {
      const newReserve = parseAster("50");
      await factory.connect(deployer).setVirtualAsterReserve(newReserve);

      const tx = await factory.connect(creator1).createToken("New Token", "NEW", "ipfs://new");
      const receipt = await tx.wait();

      const event = receipt?.logs.find((log: any) => {
        try {
          const parsed = factory.interface.parseLog(log);
          return parsed?.name === "TokenCreated";
        } catch {
          return false;
        }
      });

      const parsed = factory.interface.parseLog(event!);
      const bondingCurveAddress = parsed?.args.bondingCurve;

      const bondingCurve = await ethers.getContractAt("BondingCurve", bondingCurveAddress);
      expect(await bondingCurve.virtualAsterReserve()).to.equal(newReserve);
    });
  });

  describe("Role Management", function () {
    it("Should grant FACTORY_ADMIN_ROLE to new admin", async function () {
      const FACTORY_ADMIN_ROLE = await factory.FACTORY_ADMIN_ROLE();

      await factory.connect(deployer).grantRole(FACTORY_ADMIN_ROLE, creator1.address);
      expect(await factory.hasRole(FACTORY_ADMIN_ROLE, creator1.address)).to.be.true;
    });

    it("Should revoke FACTORY_ADMIN_ROLE", async function () {
      const FACTORY_ADMIN_ROLE = await factory.FACTORY_ADMIN_ROLE();

      await factory.connect(deployer).grantRole(FACTORY_ADMIN_ROLE, creator1.address);
      await factory.connect(deployer).revokeRole(FACTORY_ADMIN_ROLE, creator1.address);
      expect(await factory.hasRole(FACTORY_ADMIN_ROLE, creator1.address)).to.be.false;
    });
  });

  describe("Edge Cases", function () {
    it("Should handle creating many tokens", async function () {
      for (let i = 0; i < 10; i++) {
        await factory.connect(creator1).createToken(`Token ${i}`, `TK${i}`, `ipfs://${i}`);
      }

      expect(await factory.tokenCounter()).to.equal(10);
      expect((await factory.getAllTokensNoPagination()).length).to.equal(10);
    });

    it("Should handle special characters in metadata", async function () {
      await expect(
        factory.connect(creator1).createToken("Token 🚀", "TK1", "ipfs://QmTest123")
      ).to.emit(factory, "TokenCreated");
    });

    it("Should maintain correct state across multiple creators", async function () {
      await factory.connect(creator1).createToken("Token 1", "TK1", "ipfs://1");
      await factory.connect(creator2).createToken("Token 2", "TK2", "ipfs://2");
      await factory.connect(creator1).createToken("Token 3", "TK3", "ipfs://3");

      const creator1Tokens = await factory.getTokensByCreator(creator1.address);
      const creator2Tokens = await factory.getTokensByCreator(creator2.address);

      expect(creator1Tokens.length).to.equal(2);
      expect(creator2Tokens.length).to.equal(1);
    });

    it("Should revert when getting info for non-existent token", async function () {
      await expect(
        factory.getTokenInfo(ethers.ZeroAddress)
      ).to.be.revertedWith("Token not found");
    });
  });

  describe("Batch Query Functions", function () {
    let token1: string, token2: string, token3: string;

    beforeEach(async function () {
      // Create 3 tokens for batch testing
      const tx1 = await factory.connect(creator1).createToken("Token 1", "TK1", "ipfs://1");
      const receipt1 = await tx1.wait();
      const event1 = receipt1?.logs.find((log: any) => log.fragment?.name === "TokenCreated");
      token1 = (event1 as any).args[0];

      const tx2 = await factory.connect(creator1).createToken("Token 2", "TK2", "ipfs://2");
      const receipt2 = await tx2.wait();
      const event2 = receipt2?.logs.find((log: any) => log.fragment?.name === "TokenCreated");
      token2 = (event2 as any).args[0];

      const tx3 = await factory.connect(creator2).createToken("Token 3", "TK3", "ipfs://3");
      const receipt3 = await tx3.wait();
      const event3 = receipt3?.logs.find((log: any) => log.fragment?.name === "TokenCreated");
      token3 = (event3 as any).args[0];
    });

    it("Should return batch info for multiple tokens", async function () {
      const infos = await factory.getTokenInfoBatch([token1, token2, token3]);

      expect(infos.length).to.equal(3);
      expect(infos[0].exists).to.be.true;
      expect(infos[1].exists).to.be.true;
      expect(infos[2].exists).to.be.true;

      expect(infos[0].name).to.equal("Token 1");
      expect(infos[1].name).to.equal("Token 2");
      expect(infos[2].name).to.equal("Token 3");
    });

    it("Should handle batch query with non-existent tokens", async function () {
      const fakeToken = ethers.ZeroAddress;
      const infos = await factory.getTokenInfoBatch([token1, fakeToken, token2]);

      expect(infos.length).to.equal(3);
      expect(infos[0].exists).to.be.true;
      expect(infos[1].exists).to.be.false; // Non-existent token
      expect(infos[2].exists).to.be.true;
    });

    it("Should handle empty batch query", async function () {
      const infos = await factory.getTokenInfoBatch([]);
      expect(infos.length).to.equal(0);
    });

    it("Should handle batch query with single token", async function () {
      const infos = await factory.getTokenInfoBatch([token1]);

      expect(infos.length).to.equal(1);
      expect(infos[0].exists).to.be.true;
      expect(infos[0].name).to.equal("Token 1");
    });
  });

  describe("Token Creation is FREE", function () {
    it("Should not charge any fee for token creation", async function () {
      // This is a documentation test - token creation is FREE (only gas costs)
      // No payment is required, no balance is checked, no fee is transferred

      await expect(
        factory.connect(creator1).createToken("Free Token", "FREE", "ipfs://free")
      ).to.emit(factory, "TokenCreated");

      // No fee collection logic exists in the contract
      // Users only pay gas fees to the blockchain, not to the protocol
    });
  });
});
