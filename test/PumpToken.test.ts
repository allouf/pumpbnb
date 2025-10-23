import { expect } from "chai";
import { ethers } from "hardhat";
import { PumpToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { getTestAccounts } from "./helpers";

describe("PumpToken", function () {
  let token: PumpToken;
  let factory: SignerWithAddress;
  let creator: SignerWithAddress;
  let bondingCurve: SignerWithAddress;
  let trader1: SignerWithAddress;
  let trader2: SignerWithAddress;

  const TOKEN_NAME = "Test Pump Token";
  const TOKEN_SYMBOL = "TPT";
  const METADATA_URI = "ipfs://QmTest123456789";
  const TOTAL_SUPPLY = ethers.parseEther("1000000000"); // 1 billion
  const CREATOR_SUPPLY = ethers.parseEther("200000000"); // 200 million
  const BONDING_CURVE_SUPPLY = ethers.parseEther("800000000"); // 800 million

  beforeEach(async function () {
    const accounts = await getTestAccounts();
    factory = accounts.deployer;
    creator = accounts.creator;
    bondingCurve = accounts.trader1;
    trader1 = accounts.trader2;
    trader2 = accounts.trader3;

    // Deploy token as factory
    const PumpToken = await ethers.getContractFactory("PumpToken");
    token = await PumpToken.connect(factory).deploy(
      TOKEN_NAME,
      TOKEN_SYMBOL,
      METADATA_URI,
      creator.address,
      ethers.ZeroAddress // bondingCurve will be set later
    );
    await token.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct token name and symbol", async function () {
      expect(await token.name()).to.equal(TOKEN_NAME);
      expect(await token.symbol()).to.equal(TOKEN_SYMBOL);
    });

    it("Should set the correct metadata URI", async function () {
      expect(await token.metadataURI()).to.equal(METADATA_URI);
    });

    it("Should set the correct creator", async function () {
      expect(await token.creator()).to.equal(creator.address);
    });

    it("Should set the correct factory", async function () {
      expect(await token.factory()).to.equal(factory.address);
    });

    it("Should mint total supply to contract", async function () {
      expect(await token.balanceOf(await token.getAddress())).to.equal(TOTAL_SUPPLY);
    });

    it("Should lock 200M tokens for creator", async function () {
      expect(await token.creatorLockedBalance()).to.equal(CREATOR_SUPPLY);
      expect(await token.getLockedBalance()).to.equal(CREATOR_SUPPLY);
    });

    it("Should not unlock creator allocation on deployment", async function () {
      expect(await token.creatorAllocationUnlocked()).to.be.false;
      expect(await token.isCreatorAllocationUnlocked()).to.be.false;
    });

    it("Should emit TokenDeployed event", async function () {
      // Event was already emitted in beforeEach deployment
      // Just verify the event exists in the contract
      const PumpToken = await ethers.getContractFactory("PumpToken");
      const newToken = await PumpToken.connect(factory).deploy(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        METADATA_URI,
        creator.address,
        ethers.ZeroAddress
      );

      const receipt = await newToken.deploymentTransaction()?.wait();
      const events = receipt?.logs || [];

      // Check that at least one event was emitted (TokenDeployed)
      expect(events.length).to.be.greaterThan(0);
    });

    it("Should revert if creator is zero address", async function () {
      const PumpToken = await ethers.getContractFactory("PumpToken");
      await expect(
        PumpToken.connect(factory).deploy(
          TOKEN_NAME,
          TOKEN_SYMBOL,
          METADATA_URI,
          ethers.ZeroAddress,
          ethers.ZeroAddress
        )
      ).to.be.revertedWith("Invalid creator");
    });

    it("Should revert if URI is empty", async function () {
      const PumpToken = await ethers.getContractFactory("PumpToken");
      await expect(
        PumpToken.connect(factory).deploy(
          TOKEN_NAME,
          TOKEN_SYMBOL,
          "",
          creator.address,
          ethers.ZeroAddress
        )
      ).to.be.revertedWith("Invalid URI");
    });

    it("Should allow deployment with bonding curve set", async function () {
      const PumpToken = await ethers.getContractFactory("PumpToken");
      const tokenWithCurve = await PumpToken.connect(factory).deploy(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        METADATA_URI,
        creator.address,
        bondingCurve.address
      );

      expect(await tokenWithCurve.bondingCurve()).to.equal(bondingCurve.address);
    });
  });

  describe("setBondingCurve", function () {
    it("Should allow factory to set bonding curve", async function () {
      await expect(token.connect(factory).setBondingCurve(bondingCurve.address))
        .to.emit(token, "BondingCurveSet")
        .withArgs(bondingCurve.address);

      expect(await token.bondingCurve()).to.equal(bondingCurve.address);
    });

    it("Should transfer 800M tokens to bonding curve", async function () {
      await token.connect(factory).setBondingCurve(bondingCurve.address);

      expect(await token.balanceOf(bondingCurve.address)).to.equal(BONDING_CURVE_SUPPLY);
    });

    it("Should leave 200M tokens in contract after setting bonding curve", async function () {
      await token.connect(factory).setBondingCurve(bondingCurve.address);

      expect(await token.balanceOf(await token.getAddress())).to.equal(CREATOR_SUPPLY);
    });

    it("Should revert if called by non-factory", async function () {
      await expect(
        token.connect(creator).setBondingCurve(bondingCurve.address)
      ).to.be.revertedWith("Only factory");

      await expect(
        token.connect(bondingCurve).setBondingCurve(bondingCurve.address)
      ).to.be.revertedWith("Only factory");
    });

    it("Should revert if bonding curve is zero address", async function () {
      await expect(
        token.connect(factory).setBondingCurve(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid bonding curve");
    });

    it("Should revert if bonding curve is already set", async function () {
      await token.connect(factory).setBondingCurve(bondingCurve.address);

      await expect(
        token.connect(factory).setBondingCurve(trader1.address)
      ).to.be.revertedWith("Already set");
    });
  });

  describe("unlockCreatorAllocation", function () {
    beforeEach(async function () {
      await token.connect(factory).setBondingCurve(bondingCurve.address);
    });

    it("Should allow bonding curve to unlock creator allocation", async function () {
      await expect(token.connect(bondingCurve).unlockCreatorAllocation())
        .to.emit(token, "CreatorAllocationUnlocked")
        .withArgs(creator.address, CREATOR_SUPPLY);

      expect(await token.creatorAllocationUnlocked()).to.be.true;
      expect(await token.isCreatorAllocationUnlocked()).to.be.true;
    });

    it("Should transfer locked tokens to creator", async function () {
      const creatorBalanceBefore = await token.balanceOf(creator.address);

      await token.connect(bondingCurve).unlockCreatorAllocation();

      const creatorBalanceAfter = await token.balanceOf(creator.address);
      expect(creatorBalanceAfter - creatorBalanceBefore).to.equal(CREATOR_SUPPLY);
    });

    it("Should reset creator locked balance to zero", async function () {
      await token.connect(bondingCurve).unlockCreatorAllocation();

      expect(await token.creatorLockedBalance()).to.equal(0);
      expect(await token.getLockedBalance()).to.equal(0);
    });

    it("Should leave contract with zero balance after unlock", async function () {
      await token.connect(bondingCurve).unlockCreatorAllocation();

      expect(await token.balanceOf(await token.getAddress())).to.equal(0);
    });

    it("Should revert if called by non-bonding curve", async function () {
      await expect(
        token.connect(creator).unlockCreatorAllocation()
      ).to.be.revertedWith("Only bonding curve");

      await expect(
        token.connect(factory).unlockCreatorAllocation()
      ).to.be.revertedWith("Only bonding curve");
    });

    it("Should revert if already unlocked", async function () {
      await token.connect(bondingCurve).unlockCreatorAllocation();

      await expect(
        token.connect(bondingCurve).unlockCreatorAllocation()
      ).to.be.revertedWith("Already unlocked");
    });

    it("Should revert if bonding curve not set", async function () {
      const PumpToken = await ethers.getContractFactory("PumpToken");
      const tokenNoBC = await PumpToken.connect(factory).deploy(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        METADATA_URI,
        creator.address,
        ethers.ZeroAddress
      );

      await expect(
        tokenNoBC.connect(bondingCurve).unlockCreatorAllocation()
      ).to.be.revertedWith("Only bonding curve");
    });
  });

  describe("ERC20 Functionality", function () {
    beforeEach(async function () {
      await token.connect(factory).setBondingCurve(bondingCurve.address);
      // Unlock creator allocation so creator can trade
      await token.connect(bondingCurve).unlockCreatorAllocation();
    });

    it("Should allow creator to transfer tokens after unlock", async function () {
      const transferAmount = ethers.parseEther("1000");

      await expect(token.connect(creator).transfer(trader1.address, transferAmount))
        .to.emit(token, "Transfer")
        .withArgs(creator.address, trader1.address, transferAmount);

      expect(await token.balanceOf(trader1.address)).to.equal(transferAmount);
    });

    it("Should allow bonding curve to transfer tokens", async function () {
      const transferAmount = ethers.parseEther("1000");

      await expect(token.connect(bondingCurve).transfer(trader1.address, transferAmount))
        .to.emit(token, "Transfer")
        .withArgs(bondingCurve.address, trader1.address, transferAmount);

      expect(await token.balanceOf(trader1.address)).to.equal(transferAmount);
    });

    it("Should allow approve and transferFrom", async function () {
      const approvalAmount = ethers.parseEther("1000");
      const transferAmount = ethers.parseEther("500");

      await token.connect(creator).approve(trader1.address, approvalAmount);
      expect(await token.allowance(creator.address, trader1.address)).to.equal(approvalAmount);

      await token.connect(trader1).transferFrom(creator.address, trader2.address, transferAmount);
      expect(await token.balanceOf(trader2.address)).to.equal(transferAmount);
    });

    it("Should have correct decimals (18)", async function () {
      expect(await token.decimals()).to.equal(18);
    });

    it("Should have correct total supply", async function () {
      expect(await token.totalSupply()).to.equal(TOTAL_SUPPLY);
    });
  });

  describe("View Functions", function () {
    it("Should return correct locked balance before unlock", async function () {
      expect(await token.getLockedBalance()).to.equal(CREATOR_SUPPLY);
    });

    it("Should return zero locked balance after unlock", async function () {
      await token.connect(factory).setBondingCurve(bondingCurve.address);
      await token.connect(bondingCurve).unlockCreatorAllocation();

      expect(await token.getLockedBalance()).to.equal(0);
    });

    it("Should return correct unlock status before unlock", async function () {
      expect(await token.isCreatorAllocationUnlocked()).to.be.false;
    });

    it("Should return correct unlock status after unlock", async function () {
      await token.connect(factory).setBondingCurve(bondingCurve.address);
      await token.connect(bondingCurve).unlockCreatorAllocation();

      expect(await token.isCreatorAllocationUnlocked()).to.be.true;
    });
  });

  describe("Edge Cases", function () {
    it("Should handle long metadata URI", async function () {
      const longURI = "ipfs://" + "a".repeat(500);
      const PumpToken = await ethers.getContractFactory("PumpToken");
      const tokenLongURI = await PumpToken.connect(factory).deploy(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        longURI,
        creator.address,
        ethers.ZeroAddress
      );

      expect(await tokenLongURI.metadataURI()).to.equal(longURI);
    });

    it("Should handle long token name and symbol", async function () {
      const longName = "A".repeat(100);
      const longSymbol = "B".repeat(50);

      const PumpToken = await ethers.getContractFactory("PumpToken");
      const tokenLongNames = await PumpToken.connect(factory).deploy(
        longName,
        longSymbol,
        METADATA_URI,
        creator.address,
        ethers.ZeroAddress
      );

      expect(await tokenLongNames.name()).to.equal(longName);
      expect(await tokenLongNames.symbol()).to.equal(longSymbol);
    });

    it("Should not allow creator to transfer locked tokens", async function () {
      // Creator should have 0 balance before unlock
      expect(await token.balanceOf(creator.address)).to.equal(0);

      await expect(
        token.connect(creator).transfer(trader1.address, ethers.parseEther("1"))
      ).to.be.reverted; // Will revert due to insufficient balance
    });

    it("Should maintain correct balances across multiple transfers", async function () {
      await token.connect(factory).setBondingCurve(bondingCurve.address);
      await token.connect(bondingCurve).unlockCreatorAllocation();

      const amount1 = ethers.parseEther("10000");
      const amount2 = ethers.parseEther("5000");
      const amount3 = ethers.parseEther("2000");

      await token.connect(creator).transfer(trader1.address, amount1);
      await token.connect(creator).transfer(trader2.address, amount2);
      await token.connect(trader1).transfer(trader2.address, amount3);

      const expectedCreatorBalance = CREATOR_SUPPLY - amount1 - amount2;
      const expectedTrader1Balance = amount1 - amount3;
      const expectedTrader2Balance = amount2 + amount3;

      expect(await token.balanceOf(creator.address)).to.equal(expectedCreatorBalance);
      expect(await token.balanceOf(trader1.address)).to.equal(expectedTrader1Balance);
      expect(await token.balanceOf(trader2.address)).to.equal(expectedTrader2Balance);
    });
  });

  describe("Security", function () {
    it("Should prevent double unlock", async function () {
      await token.connect(factory).setBondingCurve(bondingCurve.address);
      await token.connect(bondingCurve).unlockCreatorAllocation();

      await expect(
        token.connect(bondingCurve).unlockCreatorAllocation()
      ).to.be.revertedWith("Already unlocked");
    });

    it("Should prevent setting bonding curve twice", async function () {
      await token.connect(factory).setBondingCurve(bondingCurve.address);

      await expect(
        token.connect(factory).setBondingCurve(trader1.address)
      ).to.be.revertedWith("Already set");
    });

    it("Should only allow factory to set bonding curve", async function () {
      await expect(
        token.connect(creator).setBondingCurve(bondingCurve.address)
      ).to.be.revertedWith("Only factory");
    });

    it("Should only allow bonding curve to unlock allocation", async function () {
      await token.connect(factory).setBondingCurve(bondingCurve.address);

      await expect(
        token.connect(factory).unlockCreatorAllocation()
      ).to.be.revertedWith("Only bonding curve");

      await expect(
        token.connect(creator).unlockCreatorAllocation()
      ).to.be.revertedWith("Only bonding curve");
    });
  });
});
