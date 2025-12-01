// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Constants
 * @notice Centralized contract addresses and constants for PumpBNB
 * @dev All addresses are for BSC mainnet
 */
library Constants {
    /// @notice ASTER token address on BSC mainnet
    address public constant ASTER_TOKEN = 0x000Ae314E2A2172a039B26378814C252734f556A;

    /// @notice Wrapped BNB address on BSC mainnet
    address public constant WBNB = 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c;

    /// @notice PancakeSwap V2 Factory address on BSC mainnet
    address public constant PANCAKE_FACTORY = 0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73;

    /// @notice PancakeSwap V2 Router address on BSC mainnet
    address public constant PANCAKE_ROUTER = 0x10ED43C718714eb63d5aA57B78B54704E256024E;

    /// @notice Default bonding curve trading fee (100 bps = 1%)
    uint256 public constant DEFAULT_BONDING_CURVE_FEE = 100;

    /// @notice Default creator fee share on bonding curve (30 bps = 0.3%)
    uint256 public constant DEFAULT_CREATOR_FEE = 30;

    /// @notice Default protocol fee share on bonding curve (70 bps = 0.7%)
    uint256 public constant DEFAULT_PROTOCOL_FEE = 70;

    /// @notice Default post-graduation trading fee (30 bps = 0.3%)
    uint256 public constant DEFAULT_POST_GRADUATION_FEE = 30;

    /// @notice Default post-graduation creator fee (15 bps = 0.15%)
    uint256 public constant DEFAULT_POST_GRADUATION_CREATOR_FEE = 15;

    /// @notice Default post-graduation protocol fee (15 bps = 0.15%)
    uint256 public constant DEFAULT_POST_GRADUATION_PROTOCOL_FEE = 15;

    /// @notice Default graduation threshold (10,000 ASTER)
    uint256 public constant DEFAULT_GRADUATION_THRESHOLD = 10_000 ether;

    /// @notice Maximum allowed fee (500 bps = 5%)
    uint256 public constant MAX_FEE = 500;

    /// @notice Total token supply (1 billion tokens)
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 ether;

    /// @notice Bonding curve allocation (1 billion tokens = 100%)
    uint256 public constant BONDING_CURVE_SUPPLY = 1_000_000_000 ether;

    /// @notice Creator allocation (0 tokens = 0% - fair launch)
    uint256 public constant CREATOR_SUPPLY = 0;

    /// @notice Virtual token reserve for bonding curve
    /// @dev Set to 0 because realTokenReserve (1B) IS the token liquidity
    /// @dev The virtual reserves are curve parameters, not added to real reserves
    uint256 public constant VIRTUAL_TOKEN_RESERVE = 0;

    /// @notice Default virtual ASTER reserve (~$10,000 initial MC at $1/ASTER)
    /// @dev Initial Price = virtualAster / realTokenReserve = 10,000 / 1B = 0.00001 ASTER/token
    /// @dev MC = Price * TotalSupply = 0.00001 * 1B = 10,000 ASTER = $10,000 at $1/ASTER
    uint256 public constant DEFAULT_VIRTUAL_ASTER_RESERVE = 10_000 ether;

    /// @notice Basis points denominator (10000 = 100%)
    uint256 public constant BPS_DENOMINATOR = 10000;
}
