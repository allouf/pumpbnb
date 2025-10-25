import { expect } from "chai";
import { ethers } from "hardhat";
import { BondingCurve, PumpToken, PlatformConfig, TokenFactory, GraduationManager, MockERC20 } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * Access Control Security Tests
 *
 * This suite tests that only authorized roles can execute privileged functions
 * Tests for privilege escalation, unauthorized access, and role management
 */

describe("Security - Access Control", function () {
  let bondingCurve: BondingCurve;
  let pumpToken: PumpToken;
  let platformConfig: PlatformConfig;
  let tokenFactory: TokenFactory;
  let graduationManager: GraduationManager;
  let mockAster: MockERC20;
  let owner: SignerWithAddress;
  let admin: SignerWithAddress;
  let pauser: SignerWithAddress;
  let attacker: SignerWithAddress;
  let user: SignerWithAddress;

  beforeEach(async function () {
    [owner, admin, pauser, attacker, user] = await ethers.getSigners();

    // Deploy PlatformConfig with distinct roles
    const PlatformConfigFactory = await ethers.getContractFactory("PlatformConfig");
    platformConfig = await PlatformConfigFactory.deploy(
      await owner.getAddress(), // protocol fee recipient
      await admin.getAddress(), // admin
      await pauser.getAddress()  // pauser
    );
    await platformConfig.waitForDeployment();

    // Deploy mock ASTER
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    mockAster = await MockERC20Factory.deploy(
      "Mock ASTER",
      "ASTER",
      ethers.parseEther("1000000") // 1 million initial supply
    );
    await mockAster.waitForDeployment();

    // Mint additional ASTER tokens to owner for testing
    await mockAster.mint(await owner.getAddress(), ethers.parseEther("100000"));

    // Deploy GraduationManager
    const GraduationManagerFactory = await ethers.getContractFactory("GraduationManager");
    graduationManager = await GraduationManagerFactory.deploy(
      await platformConfig.getAddress()
    );
    await graduationManager.waitForDeployment();

    // Deploy TokenFactory
    const TokenFactoryFactory = await ethers.getContractFactory("TokenFactory");
    tokenFactory = await TokenFactoryFactory.deploy(
      await platformConfig.getAddress(),
      ethers.parseEther("200") // virtual reserve
    );
    await tokenFactory.waitForDeployment();

    // Create a token
    const createTx = await tokenFactory.connect(user).createToken(
      "Access Test Token",
      "ATT",
      "ipfs://access-test"
    );
    await createTx.wait();

    const allTokens = await tokenFactory.getAllTokens(0, 1);
    const tokenAddress = allTokens[0];
    const bcAddress = await tokenFactory.getBondingCurve(tokenAddress);

    pumpToken = await ethers.getContractAt("PumpToken", tokenAddress);
    bondingCurve = await ethers.getContractAt("BondingCurve", bcAddress);
  });

  describe("PlatformConfig Access Control", function () {
    it("should prevent non-admin from updating bonding curve fees", async function () {
      await expect(
        platformConfig.connect(attacker).setBondingCurveFee(50, 15, 35)
      ).to.be.revertedWithCustomError(platformConfig, "AccessControlUnauthorizedAccount");
    });

    it("should prevent non-admin from updating post-graduation fees", async function () {
      await expect(
        platformConfig.connect(attacker).setPostGraduationFee(20, 10, 10)
      ).to.be.revertedWithCustomError(platformConfig, "AccessControlUnauthorizedAccount");
    });

    it("should prevent non-admin from updating protocol fee recipient", async function () {
      await expect(
        platformConfig.connect(attacker).setProtocolFeeRecipient(await attacker.getAddress())
      ).to.be.revertedWithCustomError(platformConfig, "AccessControlUnauthorizedAccount");
    });

    it("should prevent non-admin from updating graduation threshold", async function () {
      await expect(
        platformConfig.connect(attacker).setGraduationThreshold(ethers.parseEther("200"))
      ).to.be.revertedWithCustomError(platformConfig, "AccessControlUnauthorizedAccount");
    });

    it("should prevent non-pauser from pausing", async function () {
      await expect(
        platformConfig.connect(attacker).pause()
      ).to.be.revertedWithCustomError(platformConfig, "AccessControlUnauthorizedAccount");
    });

    it("should prevent non-pauser from unpausing", async function () {
      await platformConfig.connect(pauser).pause();

      await expect(
        platformConfig.connect(attacker).unpause()
      ).to.be.revertedWithCustomError(platformConfig, "AccessControlUnauthorizedAccount");
    });

    it("should allow pauser to pause but not modify fees", async function () {
      // Pauser can pause
      await platformConfig.connect(pauser).pause();
      expect(await platformConfig.isPaused()).to.be.true;

      // But cannot modify fees
      await expect(
        platformConfig.connect(pauser).setBondingCurveFee(50, 15, 35)
      ).to.be.revertedWithCustomError(platformConfig, "AccessControlUnauthorizedAccount");
    });

    it("should allow admin to modify fees but require separate pauser role for pausing", async function () {
      // Admin can modify fees
      await platformConfig.connect(admin).setBondingCurveFee(50, 15, 35);
      expect(await platformConfig.bondingCurveFee()).to.equal(50);

      // Admin doesn't have pauser role by default
      await expect(
        platformConfig.connect(admin).pause()
      ).to.be.revertedWithCustomError(platformConfig, "AccessControlUnauthorizedAccount");
    });

    it("should prevent attacker from granting themselves admin role", async function () {
      const ADMIN_ROLE = await platformConfig.ADMIN_ROLE();

      await expect(
        platformConfig.connect(attacker).grantRole(ADMIN_ROLE, await attacker.getAddress())
      ).to.be.revertedWithCustomError(platformConfig, "AccessControlUnauthorizedAccount");
    });
  });

  describe("TokenFactory Access Control", function () {
    it("should prevent non-admin from updating virtual ASTER reserve", async function () {
      await expect(
        tokenFactory.connect(attacker).setVirtualAsterReserve(ethers.parseEther("300"))
      ).to.be.revertedWithCustomError(tokenFactory, "AccessControlUnauthorizedAccount");
    });

    it("should allow deployer (owner) to update virtual reserve", async function () {
      // Owner is granted FACTORY_ADMIN_ROLE on deployment
      await tokenFactory.connect(owner).setVirtualAsterReserve(ethers.parseEther("300"));
      expect(await tokenFactory.virtualAsterReserve()).to.equal(ethers.parseEther("300"));
    });

    it("should prevent attacker from granting themselves factory admin role", async function () {
      const FACTORY_ADMIN_ROLE = await tokenFactory.FACTORY_ADMIN_ROLE();

      await expect(
        tokenFactory.connect(attacker).grantRole(FACTORY_ADMIN_ROLE, await attacker.getAddress())
      ).to.be.revertedWithCustomError(tokenFactory, "AccessControlUnauthorizedAccount");
    });

    it("should allow creating tokens when platform not paused", async function () {
      const tx = await tokenFactory.connect(user).createToken(
        "User Token",
        "USR",
        "ipfs://user"
      );
      await tx.wait();

      const tokenCount = await tokenFactory.getTokenCount();
      expect(tokenCount).to.be.gte(1);
    });

    it("should prevent creating tokens when platform is paused", async function () {
      await platformConfig.connect(pauser).pause();

      await expect(
        tokenFactory.connect(user).createToken("Paused Token", "PST", "ipfs://paused")
      ).to.be.revertedWith("Platform paused");
    });
  });

  describe("PumpToken Access Control", function () {
    it("should only allow factory to set bonding curve", async function () {
      // Deploy new token directly (not via factory)
      const PumpTokenFactory = await ethers.getContractFactory("PumpToken");
      const directToken = await PumpTokenFactory.deploy(
        "Direct Token",
        "DIR",
        "ipfs://direct",
        await user.getAddress(),
        ethers.ZeroAddress
      );
      await directToken.waitForDeployment();

      // Deploy bonding curve
      const BondingCurveFactory = await ethers.getContractFactory("BondingCurve");
      const directCurve = await BondingCurveFactory.deploy(
        await directToken.getAddress(),
        await user.getAddress(),
        await platformConfig.getAddress(),
        ethers.parseEther("200")
      );
      await directCurve.waitForDeployment();

      // Only factory can set bonding curve
      await expect(
        directToken.connect(user).setBondingCurve(await directCurve.getAddress())
      ).to.be.revertedWith("Only factory");

      await expect(
        directToken.connect(attacker).setBondingCurve(await directCurve.getAddress())
      ).to.be.revertedWith("Only factory");
    });

    it("should only allow bonding curve to unlock creator allocation", async function () {
      await expect(
        pumpToken.connect(user).unlockCreatorAllocation()
      ).to.be.revertedWith("Only bonding curve");

      await expect(
        pumpToken.connect(attacker).unlockCreatorAllocation()
      ).to.be.revertedWith("Only bonding curve");

      await expect(
        pumpToken.connect(owner).unlockCreatorAllocation()
      ).to.be.revertedWith("Only bonding curve");
    });

    it("should prevent setting bonding curve twice", async function () {
      // Token already has bonding curve set via factory
      const BondingCurveFactory = await ethers.getContractFactory("BondingCurve");
      const newCurve = await BondingCurveFactory.deploy(
        await pumpToken.getAddress(),
        await user.getAddress(),
        await platformConfig.getAddress(),
        ethers.parseEther("200")
      );
      await newCurve.waitForDeployment();

      // Even factory (owner) cannot set it again
      await expect(
        pumpToken.connect(owner).setBondingCurve(await newCurve.getAddress())
      ).to.be.revertedWith("Already set");
    });
  });

  describe("BondingCurve Access Control", function () {
    it("should only allow graduation manager or internal to mark as graduated", async function () {
      // Buy enough to reach threshold
      await mockAster.transfer(await user.getAddress(), ethers.parseEther("200"));
      await mockAster.connect(user).approve(await bondingCurve.getAddress(), ethers.parseEther("150"));

      // Regular users cannot mark as graduated
      await expect(
        bondingCurve.connect(user).markGraduated()
      ).to.be.revertedWith("Only graduation manager");

      await expect(
        bondingCurve.connect(attacker).markGraduated()
      ).to.be.revertedWith("Only graduation manager");
    });

    it("should only allow graduation manager to extract reserves", async function () {
      // Try to extract reserves without being graduation manager
      await expect(
        bondingCurve.connect(attacker).extractReservesForGraduation()
      ).to.be.revertedWith("Only graduation manager");

      await expect(
        bondingCurve.connect(user).extractReservesForGraduation()
      ).to.be.revertedWith("Only graduation manager");
    });

    // Note: withdrawProtocolFees() and protocolFees() don't exist in BondingCurve
    // Fees are distributed directly during trades to creator and protocol fee recipient
    // This test is removed as the functionality doesn't exist in the current implementation
  });

  describe("Role Hierarchy and Separation", function () {
    it("should enforce role separation in PlatformConfig", async function () {
      const DEFAULT_ADMIN_ROLE = await platformConfig.DEFAULT_ADMIN_ROLE();
      const ADMIN_ROLE = await platformConfig.ADMIN_ROLE();
      const PAUSER_ROLE = await platformConfig.PAUSER_ROLE();

      // Verify distinct roles
      expect(await platformConfig.hasRole(DEFAULT_ADMIN_ROLE, await owner.getAddress())).to.be.false;
      expect(await platformConfig.hasRole(DEFAULT_ADMIN_ROLE, await admin.getAddress())).to.be.true;
      expect(await platformConfig.hasRole(ADMIN_ROLE, await admin.getAddress())).to.be.true;
      expect(await platformConfig.hasRole(PAUSER_ROLE, await pauser.getAddress())).to.be.true;
      expect(await platformConfig.hasRole(PAUSER_ROLE, await admin.getAddress())).to.be.false;
    });

    it("should allow DEFAULT_ADMIN to grant and revoke other roles", async function () {
      const PAUSER_ROLE = await platformConfig.PAUSER_ROLE();

      // DEFAULT_ADMIN (admin) can grant pauser role to attacker
      await platformConfig.connect(admin).grantRole(PAUSER_ROLE, await attacker.getAddress());
      expect(await platformConfig.hasRole(PAUSER_ROLE, await attacker.getAddress())).to.be.true;

      // Now attacker can pause
      await platformConfig.connect(attacker).pause();
      expect(await platformConfig.isPaused()).to.be.true;

      // DEFAULT_ADMIN can revoke
      await platformConfig.connect(admin).revokeRole(PAUSER_ROLE, await attacker.getAddress());
      expect(await platformConfig.hasRole(PAUSER_ROLE, await attacker.getAddress())).to.be.false;

      // Unpause first
      await platformConfig.connect(pauser).unpause();

      // Attacker can no longer pause
      await expect(
        platformConfig.connect(attacker).pause()
      ).to.be.revertedWithCustomError(platformConfig, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Emergency Scenarios", function () {
    it("should allow pauser to immediately halt trading", async function () {
      // Verify trading works
      await mockAster.transfer(await user.getAddress(), ethers.parseEther("10"));
      await mockAster.connect(user).approve(await bondingCurve.getAddress(), ethers.parseEther("10"));
      await bondingCurve.connect(user).buyWithAster(ethers.parseEther("10"), 0);

      // Pauser halts platform
      await platformConfig.connect(pauser).pause();

      // Trading should now fail
      await mockAster.transfer(await user.getAddress(), ethers.parseEther("10"));
      await mockAster.connect(user).approve(await bondingCurve.getAddress(), ethers.parseEther("10"));
      await expect(
        bondingCurve.connect(user).buyWithAster(ethers.parseEther("10"), 0)
      ).to.be.revertedWith("Platform paused");
    });

    it("should prevent fee changes when paused", async function () {
      await platformConfig.connect(pauser).pause();

      // Even admin cannot change fees when paused (this depends on implementation)
      // If your implementation allows admin to configure fees while paused, adjust this test
      await expect(
        platformConfig.connect(admin).setBondingCurveFee(50, 15, 35)
      ).to.be.revertedWithCustomError(platformConfig, "EnforcedPause");
    });
  });

  describe("Creator-Specific Access", function () {
    it("should allow creator to receive fees from their token", async function () {
      // Buy tokens to generate fees
      await mockAster.transfer(await user.getAddress(), ethers.parseEther("100"));
      await mockAster.connect(user).approve(await bondingCurve.getAddress(), ethers.parseEther("50"));

      const creatorBalanceBefore = await mockAster.balanceOf(await user.getAddress());
      await bondingCurve.connect(user).buyWithAster(ethers.parseEther("50"), 0);
      const creatorBalanceAfter = await mockAster.balanceOf(await user.getAddress());

      // Creator should have received their fee share
      expect(creatorBalanceAfter).to.be.gt(creatorBalanceBefore);
    });

    it("should prevent creator from accessing locked tokens before graduation", async function () {
      const lockedBalance = await pumpToken.getLockedBalance();
      expect(lockedBalance).to.equal(ethers.parseEther("200000000")); // 200M tokens

      // Creator is the 'user' account
      const creatorBalance = await pumpToken.balanceOf(await user.getAddress());
      expect(creatorBalance).to.equal(0); // Creator has no unlocked tokens yet

      // Creator cannot transfer locked tokens (they're in the contract)
      await expect(
        pumpToken.connect(user).transfer(await attacker.getAddress(), lockedBalance)
      ).to.be.revertedWithCustomError(pumpToken, "ERC20InsufficientBalance");
    });
  });
});
