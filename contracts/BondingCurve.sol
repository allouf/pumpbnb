// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./Constants.sol";
import "./PlatformConfig.sol";
import "./PumpToken.sol";
import "./interfaces/IASTER.sol";

/**
 * @title BondingCurve
 * @notice Automated market maker using ASTER token with constant product formula
 * @dev Implements x*y=k bonding curve with virtual reserves for initial liquidity
 */
contract BondingCurve is ReentrancyGuard {
    using SafeERC20 for IERC20;
    using SafeERC20 for IASTER;

    /// @notice The PumpToken being traded
    PumpToken public immutable token;

    /// @notice ASTER token used for trading
    IASTER public immutable asterToken;

    /// @notice Platform configuration contract
    PlatformConfig public immutable config;

    /// @notice Token creator address
    address public immutable creator;

    /// @notice Virtual ASTER reserve (equivalent to 0.3 BNB worth)
    uint256 public immutable virtualAsterReserve;

    /// @notice Virtual token reserve (200M tokens)
    uint256 public constant VIRTUAL_TOKEN_RESERVE = Constants.VIRTUAL_TOKEN_RESERVE;

    /// @notice Real ASTER reserve accumulated from trades
    uint256 public realAsterReserve;

    /// @notice Real token reserve (decreases as tokens are bought)
    uint256 public realTokenReserve;

    /// @notice Whether the token has graduated to PancakeSwap
    bool public graduated;

    /// @notice Emitted when tokens are bought with ASTER
    event Buy(
        address indexed buyer,
        uint256 asterIn,
        uint256 tokensOut,
        uint256 creatorFee,
        uint256 protocolFee,
        uint256 timestamp
    );

    /// @notice Emitted when tokens are sold for ASTER
    event Sell(
        address indexed seller,
        uint256 tokensIn,
        uint256 asterOut,
        uint256 creatorFee,
        uint256 protocolFee,
        uint256 timestamp
    );

    /// @notice Emitted when bonding curve is marked as graduated
    event Graduated(uint256 asterReserve, uint256 tokenReserve, uint256 timestamp);

    /**
     * @notice Initialize the bonding curve
     * @param _token PumpToken address
     * @param _creator Creator address
     * @param _config PlatformConfig address
     * @param _virtualAsterReserve Virtual ASTER reserve amount
     * @param _asterToken ASTER token address (configurable for testnet)
     */
    constructor(
        address _token,
        address _creator,
        address _config,
        uint256 _virtualAsterReserve,
        address _asterToken
    ) {
        require(_token != address(0), "Invalid token");
        require(_creator != address(0), "Invalid creator");
        require(_config != address(0), "Invalid config");
        require(_virtualAsterReserve > 0, "Invalid virtual reserve");
        require(_asterToken != address(0), "Invalid ASTER token");

        token = PumpToken(_token);
        creator = _creator;
        config = PlatformConfig(_config);
        asterToken = IASTER(_asterToken);
        virtualAsterReserve = _virtualAsterReserve;

        // Initialize real token reserve with bonding curve allocation
        realTokenReserve = Constants.BONDING_CURVE_SUPPLY;
        realAsterReserve = 0;
        graduated = false;
    }

    /**
     * @notice Get current price (ASTER per token)
     * @return price Current price in ASTER (18 decimals)
     */
    function getPrice() public view returns (uint256 price) {
        uint256 totalAsterReserve = virtualAsterReserve + realAsterReserve;
        uint256 totalTokenReserve = VIRTUAL_TOKEN_RESERVE + realTokenReserve;

        // Price = ASTER reserve / Token reserve
        price = (totalAsterReserve * 1e18) / totalTokenReserve;
    }

    /**
     * @notice Calculate tokens received for a given ASTER input (after fees)
     * @param asterIn Amount of ASTER to spend
     * @return tokensOut Amount of tokens to receive
     * @return creatorFee Fee paid to creator
     * @return protocolFee Fee paid to protocol
     */
    function getBuyAmount(uint256 asterIn)
        public
        view
        returns (uint256 tokensOut, uint256 creatorFee, uint256 protocolFee)
    {
        require(asterIn > 0, "Invalid input");

        // Calculate fees
        (creatorFee, protocolFee) = _calculateFees(asterIn);
        uint256 asterAfterFee = asterIn - creatorFee - protocolFee;

        // Get current reserves
        uint256 totalAsterReserve = virtualAsterReserve + realAsterReserve;
        uint256 totalTokenReserve = VIRTUAL_TOKEN_RESERVE + realTokenReserve;

        // Constant product: k = x * y
        uint256 k = totalAsterReserve * totalTokenReserve;

        // New ASTER reserve after buy
        uint256 newAsterReserve = totalAsterReserve + asterAfterFee;

        // New token reserve: k / newAsterReserve
        uint256 newTokenReserve = k / newAsterReserve;

        // Tokens out = current reserve - new reserve
        tokensOut = totalTokenReserve - newTokenReserve;

        require(tokensOut > 0, "Insufficient output");
        require(tokensOut <= realTokenReserve, "Insufficient liquidity");
    }

    /**
     * @notice Calculate ASTER received for a given token input (after fees)
     * @param tokensIn Amount of tokens to sell
     * @return asterOut Amount of ASTER to receive
     * @return creatorFee Fee paid to creator
     * @return protocolFee Fee paid to protocol
     */
    function getSellAmount(uint256 tokensIn)
        public
        view
        returns (uint256 asterOut, uint256 creatorFee, uint256 protocolFee)
    {
        require(tokensIn > 0, "Invalid input");

        // Get current reserves
        uint256 totalAsterReserve = virtualAsterReserve + realAsterReserve;
        uint256 totalTokenReserve = VIRTUAL_TOKEN_RESERVE + realTokenReserve;

        // Constant product: k = x * y
        uint256 k = totalAsterReserve * totalTokenReserve;

        // New token reserve after sell
        uint256 newTokenReserve = totalTokenReserve + tokensIn;

        // New ASTER reserve: k / newTokenReserve
        uint256 newAsterReserve = k / newTokenReserve;

        // ASTER out before fee = current reserve - new reserve
        uint256 asterBeforeFee = totalAsterReserve - newAsterReserve;

        // Calculate fees on output
        (creatorFee, protocolFee) = _calculateFees(asterBeforeFee);
        asterOut = asterBeforeFee - creatorFee - protocolFee;

        require(asterOut > 0, "Insufficient output");
        require(asterOut <= realAsterReserve, "Insufficient liquidity");
    }

    /**
     * @notice Buy tokens with ASTER
     * @param asterIn Amount of ASTER to spend
     * @param minTokensOut Minimum tokens to receive (slippage protection)
     * @return tokensOut Amount of tokens received
     */
    function buyWithAster(uint256 asterIn, uint256 minTokensOut)
        external
        nonReentrant
        returns (uint256 tokensOut)
    {
        require(!graduated, "Already graduated");
        require(!config.isPaused(), "Platform paused");
        require(asterIn > 0, "Invalid input");

        // Calculate output and fees
        uint256 creatorFee;
        uint256 protocolFee;
        (tokensOut, creatorFee, protocolFee) = getBuyAmount(asterIn);

        require(tokensOut >= minTokensOut, "Slippage exceeded");

        // Transfer ASTER from buyer
        asterToken.safeTransferFrom(msg.sender, address(this), asterIn);

        // Transfer fees
        if (creatorFee > 0) {
            asterToken.safeTransfer(creator, creatorFee);
        }
        if (protocolFee > 0) {
            asterToken.safeTransfer(config.protocolFeeRecipient(), protocolFee);
        }

        // Update reserves
        uint256 asterAfterFee = asterIn - creatorFee - protocolFee;
        realAsterReserve += asterAfterFee;
        realTokenReserve -= tokensOut;

        // Transfer tokens to buyer
        IERC20(address(token)).safeTransfer(msg.sender, tokensOut);

        emit Buy(msg.sender, asterIn, tokensOut, creatorFee, protocolFee, block.timestamp);

        // Check graduation condition
        _checkGraduation();
    }

    /**
     * @notice Sell tokens for ASTER
     * @param tokensIn Amount of tokens to sell
     * @param minAsterOut Minimum ASTER to receive (slippage protection)
     * @return asterOut Amount of ASTER received
     */
    function sellForAster(uint256 tokensIn, uint256 minAsterOut)
        external
        nonReentrant
        returns (uint256 asterOut)
    {
        require(!graduated, "Already graduated");
        require(!config.isPaused(), "Platform paused");
        require(tokensIn > 0, "Invalid input");

        // Calculate output and fees
        uint256 creatorFee;
        uint256 protocolFee;
        (asterOut, creatorFee, protocolFee) = getSellAmount(tokensIn);

        require(asterOut >= minAsterOut, "Slippage exceeded");

        // Transfer tokens from seller
        IERC20(address(token)).safeTransferFrom(msg.sender, address(this), tokensIn);

        // Transfer ASTER to seller (after fees)
        asterToken.safeTransfer(msg.sender, asterOut);

        // Transfer fees
        if (creatorFee > 0) {
            asterToken.safeTransfer(creator, creatorFee);
        }
        if (protocolFee > 0) {
            asterToken.safeTransfer(config.protocolFeeRecipient(), protocolFee);
        }

        // Update reserves
        realAsterReserve -= (asterOut + creatorFee + protocolFee);
        realTokenReserve += tokensIn;

        emit Sell(msg.sender, tokensIn, asterOut, creatorFee, protocolFee, block.timestamp);
    }

    /**
     * @notice Mark bonding curve as graduated (called by GraduationManager)
     */
    function markGraduated() external {
        require(!graduated, "Already graduated");
        require(realAsterReserve >= config.graduationThreshold(), "Threshold not met");

        graduated = true;

        emit Graduated(realAsterReserve, realTokenReserve, block.timestamp);
    }

    /**
     * @notice Extract reserves for graduation (called by GraduationManager)
     * @return asterAmount ASTER reserve amount
     * @return tokenAmount Token reserve amount
     */
    function extractReserves() external returns (uint256 asterAmount, uint256 tokenAmount) {
        require(graduated, "Not graduated");

        asterAmount = realAsterReserve;
        tokenAmount = realTokenReserve;

        // Transfer reserves to caller (GraduationManager)
        if (asterAmount > 0) {
            asterToken.safeTransfer(msg.sender, asterAmount);
            realAsterReserve = 0;
        }

        if (tokenAmount > 0) {
            IERC20(address(token)).safeTransfer(msg.sender, tokenAmount);
            realTokenReserve = 0;
        }
    }

    /**
     * @notice Unlock creator allocation (called by GraduationManager after graduation)
     * @dev This function can only be called after graduation to unlock the creator's tokens
     */
    function unlockCreatorAllocation() external {
        require(graduated, "Not graduated");
        token.unlockCreatorAllocation();
    }

    /**
     * @notice Check if graduation threshold is met
     */
    function _checkGraduation() internal view {
        // Graduation is handled by GraduationManager
        // This is just a view check for the event/monitoring
        if (realAsterReserve >= config.graduationThreshold()) {
            // Graduation eligible - GraduationManager will handle it
        }
    }

    /**
     * @notice Calculate fees based on platform configuration
     * @param amount Amount to calculate fees on
     * @return creatorFee Fee for creator
     * @return protocolFee Fee for protocol
     */
    function _calculateFees(uint256 amount)
        internal
        view
        returns (uint256 creatorFee, uint256 protocolFee)
    {
        creatorFee = (amount * config.bondingCurveCreatorFee()) / Constants.BPS_DENOMINATOR;
        protocolFee = (amount * config.bondingCurveProtocolFee()) / Constants.BPS_DENOMINATOR;
    }

    /**
     * @notice Check if eligible for graduation
     * @return bool True if reserves meet threshold
     */
    function isEligibleForGraduation() external view returns (bool) {
        return realAsterReserve >= config.graduationThreshold() && !graduated;
    }

    /**
     * @notice Get current reserve state
     * @return asterReserve Current ASTER reserve
     * @return tokenReserve Current token reserve
     * @return totalAster Total ASTER reserve (virtual + real)
     * @return totalToken Total token reserve (virtual + real)
     */
    function getReserves()
        external
        view
        returns (uint256 asterReserve, uint256 tokenReserve, uint256 totalAster, uint256 totalToken)
    {
        asterReserve = realAsterReserve;
        tokenReserve = realTokenReserve;
        totalAster = virtualAsterReserve + realAsterReserve;
        totalToken = VIRTUAL_TOKEN_RESERVE + realTokenReserve;
    }
}
