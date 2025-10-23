// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IPancakeFactory
 * @notice Interface for PancakeSwap V2 Factory
 * @dev Factory address: 0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73
 */
interface IPancakeFactory {
    /// @notice Emitted when a pair is created
    event PairCreated(address indexed token0, address indexed token1, address pair, uint256);

    /// @notice Get the address of the pair for two tokens
    /// @param tokenA First token address
    /// @param tokenB Second token address
    /// @return pair Address of the pair contract (zero address if doesn't exist)
    function getPair(address tokenA, address tokenB) external view returns (address pair);

    /// @notice Create a new pair for two tokens
    /// @param tokenA First token address
    /// @param tokenB Second token address
    /// @return pair Address of the newly created pair
    function createPair(address tokenA, address tokenB) external returns (address pair);

    /// @notice Get all pairs count
    /// @return Total number of pairs created
    function allPairsLength() external view returns (uint256);

    /// @notice Get pair address by index
    /// @param index Index in the pairs array
    /// @return pair Address of the pair at the given index
    function allPairs(uint256 index) external view returns (address pair);

    /// @notice Get fee recipient address
    /// @return Address that receives protocol fees
    function feeTo() external view returns (address);

    /// @notice Get fee setter address
    /// @return Address that can set the fee recipient
    function feeToSetter() external view returns (address);
}
