import { expect } from "chai";
import { ethers } from "hardhat";
import { PlatformConfig } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { deployPlatformConfig, getTestAccounts } from "./helpers";

describe("PlatformConfig", function () {
  let config: PlatformConfig;
  let deployer: SignerWithAddress;
  let admin: SignerWithAddress;
  let pauser: SignerWithAddress;
  let protocolFeeRecipient: SignerWithAddress;
  let unauthorized: SignerWithAddress;

  const DEFAULT_BONDING_CURVE_FEE = 100n; // 1%
  const DEFAULT_CREATOR_FEE = 30n; // 0.3%
  const DEFAULT_PROTOCOL_FEE = 70n; // 0.7%
  const DEFAULT_POST_GRADUATION_FEE = 30n; // 0.3%
  const DEFAULT_POST_GRADUATION_CREATOR_FEE = 15n; // 0.15%
  const DEFAULT_POST_GRADUATION_PROTOCOL_FEE = 15n; // 0.15%
  const DEFAULT_GRADUATION_THRESHOLD = ethers.parseEther("100"); // 100 ASTER
  const MAX_FEE = 500n; // 5%

  beforeEach(async function () {
    const accounts = await getTestAccounts();
    deployer = accounts.deployer;
    admin = accounts.admin;
    pauser = accounts.pauser;
    protocolFeeRecipient = accounts.protocolFeeRecipient;
    unauthorized = accounts.trader1;

    config = await deployPlatformConfig(
      protocolFeeRecipient.address,
      admin.address,
      pauser.address
    );
  });

  describe("Deployment", function () {
    it("Should set the correct initial values", async function () {
      expect(await config.bondingCurveFee()).to.equal(DEFAULT_BONDING_CURVE_FEE);
      expect(await config.bondingCurveCreatorFee()).to.equal(DEFAULT_CREATOR_FEE);
      expect(await config.bondingCurveProtocolFee()).to.equal(DEFAULT_PROTOCOL_FEE);
      expect(await config.postGraduationFee()).to.equal(DEFAULT_POST_GRADUATION_FEE);
      expect(await config.postGraduationCreatorFee()).to.equal(DEFAULT_POST_GRADUATION_CREATOR_FEE);
      expect(await config.postGraduationProtocolFee()).to.equal(DEFAULT_POST_GRADUATION_PROTOCOL_FEE);
      expect(await config.protocolFeeRecipient()).to.equal(protocolFeeRecipient.address);
      expect(await config.graduationThreshold()).to.equal(DEFAULT_GRADUATION_THRESHOLD);
    });

    it("Should grant correct roles", async function () {
      const ADMIN_ROLE = await config.ADMIN_ROLE();
      const PAUSER_ROLE = await config.PAUSER_ROLE();
      const DEFAULT_ADMIN_ROLE = await config.DEFAULT_ADMIN_ROLE();

      expect(await config.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
      expect(await config.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
      expect(await config.hasRole(PAUSER_ROLE, pauser.address)).to.be.true;
    });

    it("Should not be paused initially", async function () {
      expect(await config.isPaused()).to.be.false;
    });

    it("Should revert if protocol fee recipient is zero address", async function () {
      const PlatformConfig = await ethers.getContractFactory("PlatformConfig");
      await expect(
        PlatformConfig.deploy(ethers.ZeroAddress, admin.address, pauser.address)
      ).to.be.revertedWith("Invalid fee recipient");
    });

    it("Should revert if admin is zero address", async function () {
      const PlatformConfig = await ethers.getContractFactory("PlatformConfig");
      await expect(
        PlatformConfig.deploy(protocolFeeRecipient.address, ethers.ZeroAddress, pauser.address)
      ).to.be.revertedWith("Invalid admin");
    });

    it("Should revert if pauser is zero address", async function () {
      const PlatformConfig = await ethers.getContractFactory("PlatformConfig");
      await expect(
        PlatformConfig.deploy(protocolFeeRecipient.address, admin.address, ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid pauser");
    });
  });

  describe("Bonding Curve Fee Management", function () {
    it("Should allow admin to update bonding curve fees", async function () {
      const newTotalFee = 200n; // 2%
      const newCreatorFee = 60n; // 0.6%
      const newProtocolFee = 140n; // 1.4%

      await expect(
        config.connect(admin).setBondingCurveFee(newTotalFee, newCreatorFee, newProtocolFee)
      )
        .to.emit(config, "BondingCurveFeeUpdated")
        .withArgs(newTotalFee, newCreatorFee, newProtocolFee, admin.address);

      expect(await config.bondingCurveFee()).to.equal(newTotalFee);
      expect(await config.bondingCurveCreatorFee()).to.equal(newCreatorFee);
      expect(await config.bondingCurveProtocolFee()).to.equal(newProtocolFee);
    });

    it("Should revert if non-admin tries to update bonding curve fees", async function () {
      await expect(
        config.connect(unauthorized).setBondingCurveFee(200n, 60n, 140n)
      ).to.be.reverted;
    });

    it("Should revert if total fee exceeds maximum", async function () {
      await expect(
        config.connect(admin).setBondingCurveFee(600n, 300n, 300n)
      ).to.be.revertedWith("Fee exceeds maximum");
    });

    it("Should revert if fee split doesn't match total", async function () {
      await expect(
        config.connect(admin).setBondingCurveFee(200n, 50n, 100n) // 50 + 100 != 200
      ).to.be.revertedWith("Fee split mismatch");
    });

    it("Should allow setting fees to maximum allowed", async function () {
      await expect(
        config.connect(admin).setBondingCurveFee(MAX_FEE, 250n, 250n)
      ).to.emit(config, "BondingCurveFeeUpdated");

      expect(await config.bondingCurveFee()).to.equal(MAX_FEE);
    });

    it("Should allow setting fees to zero", async function () {
      await expect(
        config.connect(admin).setBondingCurveFee(0n, 0n, 0n)
      ).to.emit(config, "BondingCurveFeeUpdated");

      expect(await config.bondingCurveFee()).to.equal(0n);
      expect(await config.bondingCurveCreatorFee()).to.equal(0n);
      expect(await config.bondingCurveProtocolFee()).to.equal(0n);
    });
  });

  describe("Post-Graduation Fee Management", function () {
    it("Should allow admin to update post-graduation fees", async function () {
      const newTotalFee = 50n; // 0.5%
      const newCreatorFee = 25n; // 0.25%
      const newProtocolFee = 25n; // 0.25%

      await expect(
        config.connect(admin).setPostGraduationFee(newTotalFee, newCreatorFee, newProtocolFee)
      )
        .to.emit(config, "PostGraduationFeeUpdated")
        .withArgs(newTotalFee, newCreatorFee, newProtocolFee, admin.address);

      expect(await config.postGraduationFee()).to.equal(newTotalFee);
      expect(await config.postGraduationCreatorFee()).to.equal(newCreatorFee);
      expect(await config.postGraduationProtocolFee()).to.equal(newProtocolFee);
    });

    it("Should revert if non-admin tries to update post-graduation fees", async function () {
      await expect(
        config.connect(unauthorized).setPostGraduationFee(50n, 25n, 25n)
      ).to.be.reverted;
    });

    it("Should revert if total fee exceeds maximum", async function () {
      await expect(
        config.connect(admin).setPostGraduationFee(600n, 300n, 300n)
      ).to.be.revertedWith("Fee exceeds maximum");
    });

    it("Should revert if fee split doesn't match total", async function () {
      await expect(
        config.connect(admin).setPostGraduationFee(50n, 20n, 20n) // 20 + 20 != 50
      ).to.be.revertedWith("Fee split mismatch");
    });
  });

  describe("Protocol Fee Recipient Management", function () {
    it("Should allow admin to update protocol fee recipient", async function () {
      const newRecipient = unauthorized.address;

      await expect(config.connect(admin).setProtocolFeeRecipient(newRecipient))
        .to.emit(config, "ProtocolFeeRecipientUpdated")
        .withArgs(protocolFeeRecipient.address, newRecipient);

      expect(await config.protocolFeeRecipient()).to.equal(newRecipient);
    });

    it("Should revert if non-admin tries to update protocol fee recipient", async function () {
      await expect(
        config.connect(unauthorized).setProtocolFeeRecipient(unauthorized.address)
      ).to.be.reverted;
    });

    it("Should revert if new recipient is zero address", async function () {
      await expect(
        config.connect(admin).setProtocolFeeRecipient(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid recipient");
    });
  });

  describe("Graduation Threshold Management", function () {
    it("Should allow admin to update graduation threshold", async function () {
      const newThreshold = ethers.parseEther("200"); // 200 ASTER

      await expect(config.connect(admin).setGraduationThreshold(newThreshold))
        .to.emit(config, "GraduationThresholdUpdated")
        .withArgs(DEFAULT_GRADUATION_THRESHOLD, newThreshold);

      expect(await config.graduationThreshold()).to.equal(newThreshold);
    });

    it("Should revert if non-admin tries to update graduation threshold", async function () {
      await expect(
        config.connect(unauthorized).setGraduationThreshold(ethers.parseEther("200"))
      ).to.be.reverted;
    });

    it("Should revert if threshold is zero", async function () {
      await expect(
        config.connect(admin).setGraduationThreshold(0n)
      ).to.be.revertedWith("Invalid threshold");
    });

    it("Should allow setting very high graduation threshold", async function () {
      const highThreshold = ethers.parseEther("1000000"); // 1M ASTER

      await expect(config.connect(admin).setGraduationThreshold(highThreshold))
        .to.emit(config, "GraduationThresholdUpdated");

      expect(await config.graduationThreshold()).to.equal(highThreshold);
    });

    it("Should allow setting very low graduation threshold", async function () {
      const lowThreshold = ethers.parseEther("1"); // 1 ASTER

      await expect(config.connect(admin).setGraduationThreshold(lowThreshold))
        .to.emit(config, "GraduationThresholdUpdated");

      expect(await config.graduationThreshold()).to.equal(lowThreshold);
    });
  });

  describe("Pause Functionality", function () {
    it("Should allow pauser to pause the contract", async function () {
      await expect(config.connect(pauser).pause())
        .to.emit(config, "ContractPaused")
        .withArgs(pauser.address);

      expect(await config.isPaused()).to.be.true;
    });

    it("Should allow pauser to unpause the contract", async function () {
      await config.connect(pauser).pause();

      await expect(config.connect(pauser).unpause())
        .to.emit(config, "ContractUnpaused")
        .withArgs(pauser.address);

      expect(await config.isPaused()).to.be.false;
    });

    it("Should revert if non-pauser tries to pause", async function () {
      await expect(config.connect(unauthorized).pause()).to.be.reverted;
    });

    it("Should revert if non-pauser tries to unpause", async function () {
      await config.connect(pauser).pause();
      await expect(config.connect(unauthorized).unpause()).to.be.reverted;
    });

    it("Should revert when trying to pause already paused contract", async function () {
      await config.connect(pauser).pause();
      await expect(config.connect(pauser).pause()).to.be.revertedWithCustomError(
        config,
        "EnforcedPause"
      );
    });

    it("Should revert when trying to unpause already unpaused contract", async function () {
      await expect(config.connect(pauser).unpause()).to.be.revertedWithCustomError(
        config,
        "ExpectedPause"
      );
    });

    it("Should allow admin to pause if they have pauser role", async function () {
      const PAUSER_ROLE = await config.PAUSER_ROLE();
      await config.connect(admin).grantRole(PAUSER_ROLE, admin.address);

      await expect(config.connect(admin).pause())
        .to.emit(config, "ContractPaused")
        .withArgs(admin.address);
    });
  });

  describe("Role Management", function () {
    it("Should allow admin to grant admin role", async function () {
      const ADMIN_ROLE = await config.ADMIN_ROLE();
      const newAdmin = unauthorized.address;

      await config.connect(admin).grantRole(ADMIN_ROLE, newAdmin);
      expect(await config.hasRole(ADMIN_ROLE, newAdmin)).to.be.true;
    });

    it("Should allow admin to grant pauser role", async function () {
      const PAUSER_ROLE = await config.PAUSER_ROLE();
      const newPauser = unauthorized.address;

      await config.connect(admin).grantRole(PAUSER_ROLE, newPauser);
      expect(await config.hasRole(PAUSER_ROLE, newPauser)).to.be.true;
    });

    it("Should allow admin to revoke admin role", async function () {
      const ADMIN_ROLE = await config.ADMIN_ROLE();
      const newAdmin = unauthorized.address;

      await config.connect(admin).grantRole(ADMIN_ROLE, newAdmin);
      await config.connect(admin).revokeRole(ADMIN_ROLE, newAdmin);
      expect(await config.hasRole(ADMIN_ROLE, newAdmin)).to.be.false;
    });

    it("Should allow admin to revoke pauser role", async function () {
      const PAUSER_ROLE = await config.PAUSER_ROLE();

      await config.connect(admin).revokeRole(PAUSER_ROLE, pauser.address);
      expect(await config.hasRole(PAUSER_ROLE, pauser.address)).to.be.false;
    });

    it("Should not allow non-admin to grant roles", async function () {
      const ADMIN_ROLE = await config.ADMIN_ROLE();
      await expect(
        config.connect(unauthorized).grantRole(ADMIN_ROLE, unauthorized.address)
      ).to.be.reverted;
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple fee updates correctly", async function () {
      for (let i = 1; i <= 5; i++) {
        const totalFee = BigInt(i * 10);
        const creatorFee = BigInt(i * 3);
        const protocolFee = BigInt(i * 7);

        await config.connect(admin).setBondingCurveFee(totalFee, creatorFee, protocolFee);
        expect(await config.bondingCurveFee()).to.equal(totalFee);
      }
    });

    it("Should handle pause/unpause cycles correctly", async function () {
      for (let i = 0; i < 3; i++) {
        await config.connect(pauser).pause();
        expect(await config.isPaused()).to.be.true;

        await config.connect(pauser).unpause();
        expect(await config.isPaused()).to.be.false;
      }
    });

    it("Should maintain correct state across multiple role grants", async function () {
      const ADMIN_ROLE = await config.ADMIN_ROLE();
      const accounts = await ethers.getSigners();

      for (let i = 0; i < 5; i++) {
        await config.connect(admin).grantRole(ADMIN_ROLE, accounts[i].address);
        expect(await config.hasRole(ADMIN_ROLE, accounts[i].address)).to.be.true;
      }
    });
  });
});
