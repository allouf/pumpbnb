import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * Test helper utilities for PumpBNB contracts
 */

export const ASTER_TOKEN = "0x000Ae314E2A2172a039B26378814C252734f556A";
export const WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
export const PANCAKE_FACTORY = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73";
export const PANCAKE_ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";

/**
 * Deploy PlatformConfig contract
 */
export async function deployPlatformConfig(
  protocolFeeRecipient: string,
  admin: string,
  pauser: string
) {
  const PlatformConfig = await ethers.getContractFactory("PlatformConfig");
  const config = await PlatformConfig.deploy(protocolFeeRecipient, admin, pauser);
  await config.waitForDeployment();
  return config;
}

/**
 * Deploy TokenFactory contract
 */
export async function deployTokenFactory(
  configAddress: string,
  virtualAsterReserve: bigint
) {
  const TokenFactory = await ethers.getContractFactory("TokenFactory");
  const factory = await TokenFactory.deploy(configAddress, virtualAsterReserve);
  await factory.waitForDeployment();
  return factory;
}

/**
 * Deploy GraduationManager contract
 */
export async function deployGraduationManager(configAddress: string) {
  const GraduationManager = await ethers.getContractFactory("GraduationManager");
  const manager = await GraduationManager.deploy(configAddress);
  await manager.waitForDeployment();
  return manager;
}

/**
 * Create a token using TokenFactory
 */
export async function createToken(
  factory: any,
  name: string,
  symbol: string,
  uri: string
) {
  const tx = await factory.createToken(name, symbol, uri);
  const receipt = await tx.wait();

  // Find TokenCreated event
  const event = receipt.logs.find((log: any) => {
    try {
      const parsed = factory.interface.parseLog(log);
      return parsed?.name === "TokenCreated";
    } catch {
      return false;
    }
  });

  if (!event) throw new Error("TokenCreated event not found");

  const parsed = factory.interface.parseLog(event);
  return {
    token: parsed?.args.token,
    bondingCurve: parsed?.args.bondingCurve,
    creator: parsed?.args.creator,
  };
}

/**
 * Time travel helper for testing time-based functionality
 */
export async function increaseTime(seconds: number) {
  await ethers.provider.send("evm_increaseTime", [seconds]);
  await ethers.provider.send("evm_mine", []);
}

/**
 * Snapshot and restore blockchain state
 */
export async function takeSnapshot() {
  return await ethers.provider.send("evm_snapshot", []);
}

export async function restoreSnapshot(snapshotId: string) {
  await ethers.provider.send("evm_revert", [snapshotId]);
}

/**
 * Convert basis points to percentage
 */
export function bpsToPercent(bps: number): number {
  return bps / 100;
}

/**
 * Calculate expected fee amount
 */
export function calculateFee(amount: bigint, feeBps: bigint): bigint {
  return (amount * feeBps) / 10000n;
}

/**
 * Format ASTER amount for display
 */
export function formatAster(amount: bigint): string {
  return ethers.formatEther(amount);
}

/**
 * Parse ASTER amount from string
 */
export function parseAster(amount: string): bigint {
  return ethers.parseEther(amount);
}

/**
 * Get accounts for testing
 */
export async function getTestAccounts() {
  const [deployer, admin, pauser, protocolFeeRecipient, creator, trader1, trader2, trader3] =
    await ethers.getSigners();

  return {
    deployer,
    admin,
    pauser,
    protocolFeeRecipient,
    creator,
    trader1,
    trader2,
    trader3,
  };
}

/**
 * Deploy mock ERC20 token for testing
 */
export async function deployMockERC20(name: string, symbol: string, initialSupply: bigint) {
  const MockERC20 = await ethers.getContractFactory("contracts/test/MockERC20.sol:MockERC20");
  const token = await MockERC20.deploy(name, symbol, initialSupply);
  await token.waitForDeployment();
  return token;
}
