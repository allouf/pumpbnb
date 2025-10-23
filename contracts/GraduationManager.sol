// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./Constants.sol";
import "./PlatformConfig.sol";
import "./BondingCurve.sol";
import "./PumpToken.sol";
import "./interfaces/IASTER.sol";
import "./interfaces/IWBNB.sol";
import "./interfaces/IPancakeRouter.sol";
import "./interfaces/IPancakeFactory.sol";

/**
 * @title GraduationManager
 * @notice Handles migration from bonding curve to PancakeSwap when threshold reached
 * @dev Converts ASTER to WBNB, creates Token/WBNB pair, adds liquidity, and burns LP tokens
 */
contract GraduationManager is ReentrancyGuard {
    using SafeERC20 for IERC20;
    using SafeERC20 for IASTER;

    /// @notice Platform configuration contract
    PlatformConfig public immutable config;

    /// @notice PancakeSwap Router V2
    IPancakeRouter public immutable pancakeRouter;

    /// @notice PancakeSwap Factory V2
    IPancakeFactory public immutable pancakeFactory;

    /// @notice ASTER token
    IASTER public immutable asterToken;

    /// @notice WBNB token
    IWBNB public immutable wbnb;

    /// @notice Minimum slippage protection percentage (95%)
    uint256 public constant MIN_SLIPPAGE_PERCENT = 95;

    /// @notice Slippage denominator (100 = 100%)
    uint256 public constant SLIPPAGE_DENOMINATOR = 100;

    /// @notice Deadline buffer for swaps (5 minutes)
    uint256 public constant DEADLINE_BUFFER = 300;

    /// @notice Mapping of bonding curves to their graduation status
    mapping(address => bool) public hasGraduated;

    /// @notice Mapping of tokens to their PancakeSwap pair addresses
    mapping(address => address) public tokenToPancakePair;

    /// @notice Emitted when a token graduates to PancakeSwap
    event GraduationCompleted(
        address indexed token,
        address indexed bondingCurve,
        address indexed pancakePair,
        uint256 asterUsed,
        uint256 wbnbAdded,
        uint256 tokensAdded,
        uint256 lpTokensBurned,
        uint256 timestamp
    );

    /// @notice Emitted when ASTER is swapped to WBNB
    event AsterSwapped(
        address indexed bondingCurve,
        uint256 asterIn,
        uint256 wbnbOut,
        uint256 timestamp
    );

    /// @notice Emitted when liquidity is added to PancakeSwap
    event LiquidityAdded(
        address indexed token,
        address indexed pair,
        uint256 wbnbAmount,
        uint256 tokenAmount,
        uint256 lpTokens,
        uint256 timestamp
    );

    /**
     * @notice Initialize the GraduationManager
     * @param _config PlatformConfig address
     */
    constructor(address _config) {
        require(_config != address(0), "Invalid config");

        config = PlatformConfig(_config);
        pancakeRouter = IPancakeRouter(Constants.PANCAKE_ROUTER);
        pancakeFactory = IPancakeFactory(Constants.PANCAKE_FACTORY);
        asterToken = IASTER(Constants.ASTER_TOKEN);
        wbnb = IWBNB(Constants.WBNB);
    }

    /**
     * @notice Check if a bonding curve is eligible for graduation
     * @param bondingCurve Address of the bonding curve
     * @return bool True if eligible, false otherwise
     */
    function checkGraduationEligibility(address bondingCurve) public view returns (bool) {
        require(bondingCurve != address(0), "Invalid bonding curve");

        BondingCurve curve = BondingCurve(bondingCurve);

        // Check if already graduated
        if (hasGraduated[bondingCurve] || curve.graduated()) {
            return false;
        }

        // Check if ASTER reserves meet threshold
        (uint256 asterReserve, , , ) = curve.getReserves();
        return asterReserve >= config.graduationThreshold();
    }

    /**
     * @notice Execute graduation process for a bonding curve
     * @param bondingCurve Address of the bonding curve to graduate
     * @return pancakePair Address of the created PancakeSwap pair
     */
    function executeGraduation(address bondingCurve)
        external
        nonReentrant
        returns (address pancakePair)
    {
        require(!config.isPaused(), "Platform paused");
        require(checkGraduationEligibility(bondingCurve), "Not eligible");

        BondingCurve curve = BondingCurve(bondingCurve);
        PumpToken token = curve.token();

        // Mark as graduated first to prevent reentrancy
        hasGraduated[bondingCurve] = true;
        curve.markGraduated();

        // Step 1: Extract reserves from bonding curve
        (uint256 asterAmount, uint256 tokenAmount) = curve.extractReserves();
        require(asterAmount >= config.graduationThreshold(), "Insufficient ASTER");
        require(tokenAmount > 0, "No tokens to migrate");

        // Step 2: Swap ASTER to WBNB
        uint256 wbnbReceived = _swapAsterToWBNB(asterAmount);
        require(wbnbReceived > 0, "ASTER swap failed");

        emit AsterSwapped(bondingCurve, asterAmount, wbnbReceived, block.timestamp);

        // Step 3: Add liquidity to PancakeSwap
        uint256 lpTokens;
        (pancakePair, lpTokens) = _addLiquidityToPancake(
            address(token),
            wbnbReceived,
            tokenAmount
        );

        // Store pair address
        tokenToPancakePair[address(token)] = pancakePair;

        // Step 4: Unlock creator allocation
        token.unlockCreatorAllocation();

        emit GraduationCompleted(
            address(token),
            bondingCurve,
            pancakePair,
            asterAmount,
            wbnbReceived,
            tokenAmount,
            lpTokens,
            block.timestamp
        );

        return pancakePair;
    }

    /**
     * @notice Swap ASTER tokens to WBNB via PancakeSwap
     * @param asterAmount Amount of ASTER to swap
     * @return wbnbReceived Amount of WBNB received
     */
    function _swapAsterToWBNB(uint256 asterAmount) internal returns (uint256 wbnbReceived) {
        require(asterAmount > 0, "Invalid amount");

        // Approve ASTER to router
        asterToken.approve(address(pancakeRouter), asterAmount);

        // Build swap path: ASTER -> WBNB
        address[] memory path = new address[](2);
        path[0] = address(asterToken);
        path[1] = address(wbnb);

        // Calculate minimum output with slippage protection
        uint256[] memory amountsOut = pancakeRouter.getAmountsOut(asterAmount, path);
        uint256 minWbnbOut = (amountsOut[1] * MIN_SLIPPAGE_PERCENT) / SLIPPAGE_DENOMINATOR;

        // Execute swap
        uint256[] memory amounts = pancakeRouter.swapExactTokensForTokens(
            asterAmount,
            minWbnbOut,
            path,
            address(this),
            block.timestamp + DEADLINE_BUFFER
        );

        wbnbReceived = amounts[1];
        require(wbnbReceived >= minWbnbOut, "Slippage too high");
    }

    /**
     * @notice Add liquidity to PancakeSwap and burn LP tokens
     * @param token Token address
     * @param wbnbAmount Amount of WBNB to add
     * @param tokenAmount Amount of tokens to add
     * @return pairAddress Address of the PancakeSwap pair
     * @return lpTokens Amount of LP tokens burned
     */
    function _addLiquidityToPancake(
        address token,
        uint256 wbnbAmount,
        uint256 tokenAmount
    ) internal returns (address pairAddress, uint256 lpTokens) {
        require(token != address(0), "Invalid token");
        require(wbnbAmount > 0, "Invalid WBNB amount");
        require(tokenAmount > 0, "Invalid token amount");

        // Create pair if it doesn't exist
        pairAddress = pancakeFactory.getPair(token, address(wbnb));
        if (pairAddress == address(0)) {
            pairAddress = pancakeFactory.createPair(token, address(wbnb));
            require(pairAddress != address(0), "Pair creation failed");
        }

        // Approve tokens to router
        IERC20(token).approve(address(pancakeRouter), tokenAmount);
        IERC20(address(wbnb)).approve(address(pancakeRouter), wbnbAmount);

        // Add liquidity
        uint256 wbnbUsed;
        uint256 tokensUsed;
        (tokensUsed, wbnbUsed, lpTokens) = pancakeRouter.addLiquidity(
            token,
            address(wbnb),
            tokenAmount,
            wbnbAmount,
            0, // Accept any amount of tokens (we're the only liquidity provider initially)
            0, // Accept any amount of WBNB
            address(this),
            block.timestamp + DEADLINE_BUFFER
        );

        require(lpTokens > 0, "No LP tokens received");

        emit LiquidityAdded(token, pairAddress, wbnbUsed, tokensUsed, lpTokens, block.timestamp);

        // Burn LP tokens to address(0) for permanent lock
        IERC20(pairAddress).transfer(address(0), lpTokens);

        // Return any unused tokens/WBNB (dust amounts)
        uint256 unusedTokens = tokenAmount - tokensUsed;
        uint256 unusedWbnb = wbnbAmount - wbnbUsed;

        if (unusedTokens > 0) {
            IERC20(token).transfer(config.protocolFeeRecipient(), unusedTokens);
        }

        if (unusedWbnb > 0) {
            IERC20(address(wbnb)).transfer(config.protocolFeeRecipient(), unusedWbnb);
        }
    }

    /**
     * @notice Get graduation status for a bonding curve
     * @param bondingCurve Address of the bonding curve
     * @return graduated True if graduated, false otherwise
     */
    function isGraduated(address bondingCurve) external view returns (bool graduated) {
        return hasGraduated[bondingCurve];
    }

    /**
     * @notice Get PancakeSwap pair address for a token
     * @param token Token address
     * @return pairAddress PancakeSwap pair address (address(0) if not graduated)
     */
    function getPancakePair(address token) external view returns (address pairAddress) {
        return tokenToPancakePair[token];
    }
}
