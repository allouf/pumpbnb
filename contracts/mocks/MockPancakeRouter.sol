// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockPancakeRouter
 * @notice Mock PancakeSwap V2 Router for testing
 */
contract MockPancakeRouter {
    address public immutable factory;
    address public immutable WBNB;

    constructor(address _factory, address _WBNB) {
        factory = _factory;
        WBNB = _WBNB;
    }

    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts) {
        require(deadline >= block.timestamp, "EXPIRED");
        require(path.length >= 2, "INVALID_PATH");

        amounts = new uint[](path.length);
        amounts[0] = amountIn;

        // Simplified swap logic for testing
        // For mock: 1 ASTER = 0.1 WBNB (10:1 ratio)
        if (path[0] != WBNB && path[path.length - 1] == WBNB) {
            // Swapping to WBNB
            amounts[amounts.length - 1] = amountIn / 10;
        } else if (path[0] == WBNB && path[path.length - 1] != WBNB) {
            // Swapping from WBNB
            amounts[amounts.length - 1] = amountIn * 10;
        } else {
            // Same ratio for other swaps
            amounts[amounts.length - 1] = amountIn;
        }

        require(amounts[amounts.length - 1] >= amountOutMin, "INSUFFICIENT_OUTPUT_AMOUNT");

        // Transfer tokens
        IERC20(path[0]).transferFrom(msg.sender, address(this), amounts[0]);
        IERC20(path[path.length - 1]).transfer(to, amounts[amounts.length - 1]);

        return amounts;
    }

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB, uint liquidity) {
        require(deadline >= block.timestamp, "EXPIRED");

        // Transfer tokens to this router first
        IERC20(tokenA).transferFrom(msg.sender, address(this), amountADesired);
        IERC20(tokenB).transferFrom(msg.sender, address(this), amountBDesired);

        // Get or create pair
        address pair = IPancakeFactory(factory).getPair(tokenA, tokenB);
        if (pair == address(0)) {
            pair = IPancakeFactory(factory).createPair(tokenA, tokenB);
        }

        // Transfer tokens to pair
        IERC20(tokenA).transfer(pair, amountADesired);
        IERC20(tokenB).transfer(pair, amountBDesired);

        // Mint LP tokens
        liquidity = IPancakePair(pair).mint(to);

        amountA = amountADesired;
        amountB = amountBDesired;

        require(amountA >= amountAMin, "INSUFFICIENT_A_AMOUNT");
        require(amountB >= amountBMin, "INSUFFICIENT_B_AMOUNT");

        return (amountA, amountB, liquidity);
    }

    function getAmountsOut(uint amountIn, address[] memory path)
        external
        view
        returns (uint[] memory amounts)
    {
        require(path.length >= 2, "INVALID_PATH");
        amounts = new uint[](path.length);
        amounts[0] = amountIn;

        // Simplified pricing for testing
        if (path[0] != WBNB && path[path.length - 1] == WBNB) {
            amounts[amounts.length - 1] = amountIn / 10;
        } else if (path[0] == WBNB && path[path.length - 1] != WBNB) {
            amounts[amounts.length - 1] = amountIn * 10;
        } else {
            amounts[amounts.length - 1] = amountIn;
        }

        return amounts;
    }
}

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

interface IPancakeFactory {
    function getPair(address tokenA, address tokenB) external view returns (address pair);
    function createPair(address tokenA, address tokenB) external returns (address pair);
}

interface IPancakePair {
    function mint(address to) external returns (uint liquidity);
}
