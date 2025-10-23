// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IPancakeRouter
 * @notice Interface for PancakeSwap V2 Router
 * @dev Router address: 0x10ED43C718714eb63d5aA57B78B54704E256024E
 */
interface IPancakeRouter {
    /// @notice Get the factory address
    /// @return Address of the PancakeSwap factory
    function factory() external pure returns (address);

    /// @notice Get the WBNB address
    /// @return Address of Wrapped BNB
    function WETH() external pure returns (address);

    /// @notice Add liquidity to a token pair
    /// @param tokenA Address of first token
    /// @param tokenB Address of second token
    /// @param amountADesired Desired amount of tokenA
    /// @param amountBDesired Desired amount of tokenB
    /// @param amountAMin Minimum amount of tokenA (slippage protection)
    /// @param amountBMin Minimum amount of tokenB (slippage protection)
    /// @param to Recipient of LP tokens
    /// @param deadline Transaction deadline timestamp
    /// @return amountA Actual amount of tokenA added
    /// @return amountB Actual amount of tokenB added
    /// @return liquidity Amount of LP tokens minted
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB, uint256 liquidity);

    /// @notice Swap exact tokens for tokens
    /// @param amountIn Amount of input tokens
    /// @param amountOutMin Minimum amount of output tokens (slippage protection)
    /// @param path Array of token addresses (swap path)
    /// @param to Recipient of output tokens
    /// @param deadline Transaction deadline timestamp
    /// @return amounts Array of amounts for each step in the path
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    /// @notice Get amounts out for a given input amount
    /// @param amountIn Input amount
    /// @param path Swap path
    /// @return amounts Expected output amounts
    function getAmountsOut(uint256 amountIn, address[] calldata path)
        external
        view
        returns (uint256[] memory amounts);

    /// @notice Quote liquidity addition
    /// @param amountA Amount of tokenA
    /// @param reserveA Reserve of tokenA in pair
    /// @param reserveB Reserve of tokenB in pair
    /// @return amountB Required amount of tokenB
    function quote(uint256 amountA, uint256 reserveA, uint256 reserveB)
        external
        pure
        returns (uint256 amountB);
}
