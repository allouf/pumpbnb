// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./Constants.sol";
import "./PlatformConfig.sol";
import "./PumpToken.sol";
import "./BondingCurve.sol";

/**
 * @title TokenFactory
 * @notice Factory contract for creating new PumpTokens with bonding curves
 * @dev Token creation is FREE (only gas costs, no platform fee)
 */
contract TokenFactory is ReentrancyGuard, AccessControl {
    /// @notice Platform configuration contract
    PlatformConfig public immutable config;

    /// @notice Counter for total tokens created
    uint256 public tokenCounter;

    /// @notice Virtual ASTER reserve for bonding curves (~$10k initial MC at 10k ASTER)
    uint256 public virtualAsterReserve;

    /// @notice Mapping from token address to bonding curve address
    mapping(address => address) public tokenToBondingCurve;

    /// @notice Mapping from token address to token metadata
    mapping(address => TokenInfo) public tokenMetadata;

    /// @notice Array of all created token addresses
    address[] public allTokens;

    /// @notice Admin role identifier
    bytes32 public constant FACTORY_ADMIN_ROLE = keccak256("FACTORY_ADMIN_ROLE");

    /// @notice Token metadata structure
    struct TokenInfo {
        address token;
        address bondingCurve;
        address creator;
        string name;
        string symbol;
        string uri;
        uint256 createdAt;
        bool exists;
    }

    /// @notice Emitted when a new token is created
    event TokenCreated(
        address indexed token,
        address indexed bondingCurve,
        address indexed creator,
        string name,
        string symbol,
        string uri,
        uint256 tokenId,
        uint256 timestamp
    );

    /// @notice Emitted when virtual ASTER reserve is updated
    event VirtualAsterReserveUpdated(uint256 oldReserve, uint256 newReserve);

    /**
     * @notice Initialize the TokenFactory
     * @param _config PlatformConfig address
     * @param _virtualAsterReserve Virtual ASTER reserve for bonding curves
     */
    constructor(address _config, uint256 _virtualAsterReserve) {
        require(_config != address(0), "Invalid config");
        require(_virtualAsterReserve > 0, "Invalid virtual reserve");

        config = PlatformConfig(_config);
        virtualAsterReserve = _virtualAsterReserve;
        tokenCounter = 0;

        // Grant roles to deployer
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(FACTORY_ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Create a new token with bonding curve (FREE - only gas costs)
     * @param name Token name (1-32 characters)
     * @param symbol Token symbol (1-10 characters)
     * @param uri Metadata URI (IPFS hash or external link)
     * @return tokenAddress Address of the created token
     * @return bondingCurveAddress Address of the created bonding curve
     */
    function createToken(
        string memory name,
        string memory symbol,
        string memory uri
    ) external nonReentrant returns (address tokenAddress, address bondingCurveAddress) {
        require(!config.isPaused(), "Platform paused");
        require(bytes(name).length > 0 && bytes(name).length <= 32, "Invalid name length");
        require(bytes(symbol).length > 0 && bytes(symbol).length <= 10, "Invalid symbol length");
        require(bytes(uri).length > 0 && bytes(uri).length <= 256, "Invalid URI length");

        // Increment counter
        uint256 tokenId = tokenCounter++;

        // Deploy token first with bonding curve as address(0)
        PumpToken token = new PumpToken(name, symbol, uri, msg.sender, address(0));
        tokenAddress = address(token);

        // Deploy bonding curve with token address and ASTER token from config
        BondingCurve curve = new BondingCurve(
            tokenAddress,
            msg.sender,
            address(config),
            virtualAsterReserve,
            config.asterToken()
        );
        bondingCurveAddress = address(curve);

        // Set bonding curve in token and transfer tokens to it
        token.setBondingCurve(bondingCurveAddress);

        // Register token
        tokenToBondingCurve[tokenAddress] = bondingCurveAddress;
        allTokens.push(tokenAddress);

        // Store metadata
        tokenMetadata[tokenAddress] = TokenInfo({
            token: tokenAddress,
            bondingCurve: bondingCurveAddress,
            creator: msg.sender,
            name: name,
            symbol: symbol,
            uri: uri,
            createdAt: block.timestamp,
            exists: true
        });

        emit TokenCreated(
            tokenAddress,
            bondingCurveAddress,
            msg.sender,
            name,
            symbol,
            uri,
            tokenId,
            block.timestamp
        );
    }

    /**
     * @notice Update virtual ASTER reserve for new bonding curves
     * @param _newReserve New virtual ASTER reserve amount
     */
    function setVirtualAsterReserve(uint256 _newReserve) external onlyRole(FACTORY_ADMIN_ROLE) {
        require(_newReserve > 0, "Invalid reserve");
        uint256 oldReserve = virtualAsterReserve;
        virtualAsterReserve = _newReserve;

        emit VirtualAsterReserveUpdated(oldReserve, _newReserve);
    }

    /**
     * @notice Get token information
     * @param token Token address
     * @return info TokenInfo struct with all metadata
     */
    function getTokenInfo(address token) external view returns (TokenInfo memory info) {
        require(tokenMetadata[token].exists, "Token not found");
        return tokenMetadata[token];
    }

    /**
     * @notice Get bonding curve address for a token
     * @param token Token address
     * @return bondingCurve Bonding curve address (address(0) if not found)
     */
    function getBondingCurve(address token) external view returns (address bondingCurve) {
        return tokenToBondingCurve[token];
    }

    /**
     * @notice Get total number of tokens created
     * @return count Total token count
     */
    function getTokenCount() external view returns (uint256 count) {
        return tokenCounter;
    }

    /**
     * @notice Get all tokens with pagination
     * @param offset Starting index
     * @param limit Maximum number of tokens to return
     * @return tokens Array of token addresses
     */
    function getAllTokens(uint256 offset, uint256 limit)
        external
        view
        returns (address[] memory tokens)
    {
        require(offset < allTokens.length || allTokens.length == 0, "Offset out of bounds");

        uint256 end = offset + limit;
        if (end > allTokens.length) {
            end = allTokens.length;
        }

        uint256 length = end - offset;
        tokens = new address[](length);

        for (uint256 i = 0; i < length; i++) {
            tokens[i] = allTokens[offset + i];
        }
    }

    /**
     * @notice Get multiple token infos in batch
     * @param tokens Array of token addresses
     * @return infos Array of TokenInfo structs
     */
    function getTokenInfoBatch(address[] calldata tokens)
        external
        view
        returns (TokenInfo[] memory infos)
    {
        infos = new TokenInfo[](tokens.length);

        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokenMetadata[tokens[i]].exists) {
                infos[i] = tokenMetadata[tokens[i]];
            }
        }
    }

    /**
     * @notice Check if a token was created by this factory
     * @param token Token address to check
     * @return exists True if token exists, false otherwise
     */
    function tokenExists(address token) external view returns (bool exists) {
        return tokenMetadata[token].exists;
    }

    /**
     * @notice Get tokens created by a specific creator
     * @param creator Creator address
     * @return tokens Array of token addresses created by the creator
     */
    function getTokensByCreator(address creator) external view returns (address[] memory tokens) {
        uint256 count = 0;

        // First pass: count tokens
        for (uint256 i = 0; i < allTokens.length; i++) {
            if (tokenMetadata[allTokens[i]].creator == creator) {
                count++;
            }
        }

        // Second pass: populate array
        tokens = new address[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < allTokens.length; i++) {
            if (tokenMetadata[allTokens[i]].creator == creator) {
                tokens[index] = allTokens[i];
                index++;
            }
        }
    }

    /**
     * @notice Get all token addresses (no pagination)
     * @return Array of all token addresses
     */
    function getAllTokensNoPagination() external view returns (address[] memory) {
        return allTokens;
    }
}
