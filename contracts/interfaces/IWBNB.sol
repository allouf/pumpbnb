// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title IWBNB
 * @notice Interface for Wrapped BNB
 * @dev WBNB address: 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c
 */
interface IWBNB is IERC20 {
    /// @notice Deposit BNB and receive WBNB
    function deposit() external payable;

    /// @notice Withdraw BNB by burning WBNB
    /// @param wad Amount of WBNB to burn
    function withdraw(uint256 wad) external;
}
