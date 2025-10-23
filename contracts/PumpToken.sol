// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./Constants.sol";

/**
 * @title PumpToken
 * @notice BEP-20 token deployed via TokenFactory with creator allocation locking
 * @dev Fixed supply of 1B tokens: 800M to bonding curve, 200M locked for creator
 */
contract PumpToken is ERC20 {
    /// @notice Token metadata URI (IPFS or external storage)
    string public metadataURI;

    /// @notice Address of the token creator
    address public creator;

    /// @notice Address of the bonding curve contract
    address public bondingCurve;

    /// @notice Timestamp when creator allocation unlocks (at graduation)
    bool public creatorAllocationUnlocked;

    /// @notice Creator's locked token balance
    uint256 public creatorLockedBalance;

    /// @notice Factory that deployed this token
    address public immutable factory;

    /// @notice Emitted when token is deployed
    event TokenDeployed(
        address indexed token,
        address indexed creator,
        string name,
        string symbol,
        string uri
    );

    /// @notice Emitted when bonding curve is set
    event BondingCurveSet(address indexed bondingCurve);

    /// @notice Emitted when creator allocation is unlocked
    event CreatorAllocationUnlocked(address indexed creator, uint256 amount);

    /**
     * @notice Initialize the token
     * @param _name Token name
     * @param _symbol Token symbol
     * @param _uri Metadata URI
     * @param _creator Creator address
     * @param _bondingCurve Bonding curve address (can be address(0) if set later)
     */
    constructor(
        string memory _name,
        string memory _symbol,
        string memory _uri,
        address _creator,
        address _bondingCurve
    ) ERC20(_name, _symbol) {
        require(_creator != address(0), "Invalid creator");
        require(bytes(_uri).length > 0, "Invalid URI");

        metadataURI = _uri;
        creator = _creator;
        bondingCurve = _bondingCurve;
        factory = msg.sender;
        creatorAllocationUnlocked = false;

        // Mint total supply to this contract
        _mint(address(this), Constants.TOTAL_SUPPLY);

        // Lock 200M for creator
        creatorLockedBalance = Constants.CREATOR_SUPPLY;

        emit TokenDeployed(address(this), _creator, _name, _symbol, _uri);
    }

    /**
     * @notice Set bonding curve address (only callable once by factory)
     * @param _bondingCurve Bonding curve address
     */
    function setBondingCurve(address _bondingCurve) external {
        require(msg.sender == factory, "Only factory");
        require(bondingCurve == address(0), "Already set");
        require(_bondingCurve != address(0), "Invalid bonding curve");

        bondingCurve = _bondingCurve;

        // Transfer 800M tokens to bonding curve
        _transfer(address(this), _bondingCurve, Constants.BONDING_CURVE_SUPPLY);

        emit BondingCurveSet(_bondingCurve);
    }

    /**
     * @notice Unlock creator allocation (called by bonding curve at graduation)
     * @dev Can only be called once by the bonding curve contract
     */
    function unlockCreatorAllocation() external {
        require(msg.sender == bondingCurve, "Only bonding curve");
        require(!creatorAllocationUnlocked, "Already unlocked");
        require(creatorLockedBalance > 0, "No locked balance");

        creatorAllocationUnlocked = true;

        // Transfer locked tokens to creator
        _transfer(address(this), creator, creatorLockedBalance);

        emit CreatorAllocationUnlocked(creator, creatorLockedBalance);

        // Reset locked balance
        creatorLockedBalance = 0;
    }

    /**
     * @notice Get the locked balance for creator
     * @return uint256 Amount of tokens locked for creator
     */
    function getLockedBalance() external view returns (uint256) {
        if (creatorAllocationUnlocked) {
            return 0;
        }
        return creatorLockedBalance;
    }

    /**
     * @notice Check if creator allocation is unlocked
     * @return bool True if unlocked, false otherwise
     */
    function isCreatorAllocationUnlocked() external view returns (bool) {
        return creatorAllocationUnlocked;
    }
}
