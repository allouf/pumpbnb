// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./Constants.sol";

/**
 * @title PlatformConfig
 * @notice Central configuration contract for PumpBNB platform
 * @dev Manages fees, thresholds, and emergency pause functionality
 */
contract PlatformConfig is AccessControl, Pausable {
    /// @notice Role identifier for admin operations
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    /// @notice Role identifier for pause operations
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /// @notice Bonding curve trading fee (creator + protocol)
    uint256 public bondingCurveFee;

    /// @notice Creator fee share on bonding curve trades
    uint256 public bondingCurveCreatorFee;

    /// @notice Protocol fee share on bonding curve trades
    uint256 public bondingCurveProtocolFee;

    /// @notice Post-graduation trading fee (total)
    uint256 public postGraduationFee;

    /// @notice Creator fee share on post-graduation trades
    uint256 public postGraduationCreatorFee;

    /// @notice Protocol fee share on post-graduation trades
    uint256 public postGraduationProtocolFee;

    /// @notice Address receiving protocol fees
    address public protocolFeeRecipient;

    /// @notice ASTER amount required to trigger graduation
    uint256 public graduationThreshold;

    /// @notice Emitted when bonding curve fee is updated
    event BondingCurveFeeUpdated(
        uint256 totalFee,
        uint256 creatorFee,
        uint256 protocolFee,
        address indexed updatedBy
    );

    /// @notice Emitted when post-graduation fee is updated
    event PostGraduationFeeUpdated(
        uint256 totalFee,
        uint256 creatorFee,
        uint256 protocolFee,
        address indexed updatedBy
    );

    /// @notice Emitted when protocol fee recipient is updated
    event ProtocolFeeRecipientUpdated(address indexed oldRecipient, address indexed newRecipient);

    /// @notice Emitted when graduation threshold is updated
    event GraduationThresholdUpdated(uint256 indexed oldThreshold, uint256 indexed newThreshold);

    /// @notice Emitted when contract is paused
    event ContractPaused(address indexed pausedBy);

    /// @notice Emitted when contract is unpaused
    event ContractUnpaused(address indexed unpausedBy);

    /**
     * @notice Initialize the platform configuration
     * @param _protocolFeeRecipient Address to receive protocol fees
     * @param _admin Address to grant admin role
     * @param _pauser Address to grant pauser role
     */
    constructor(address _protocolFeeRecipient, address _admin, address _pauser) {
        require(_protocolFeeRecipient != address(0), "Invalid fee recipient");
        require(_admin != address(0), "Invalid admin");
        require(_pauser != address(0), "Invalid pauser");

        // Set default fees
        bondingCurveFee = Constants.DEFAULT_BONDING_CURVE_FEE;
        bondingCurveCreatorFee = Constants.DEFAULT_CREATOR_FEE;
        bondingCurveProtocolFee = Constants.DEFAULT_PROTOCOL_FEE;

        postGraduationFee = Constants.DEFAULT_POST_GRADUATION_FEE;
        postGraduationCreatorFee = Constants.DEFAULT_POST_GRADUATION_CREATOR_FEE;
        postGraduationProtocolFee = Constants.DEFAULT_POST_GRADUATION_PROTOCOL_FEE;

        protocolFeeRecipient = _protocolFeeRecipient;
        graduationThreshold = Constants.DEFAULT_GRADUATION_THRESHOLD;

        // Grant roles
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(PAUSER_ROLE, _pauser);
    }

    /**
     * @notice Update bonding curve fee structure
     * @param _totalFee Total fee in basis points (creator + protocol)
     * @param _creatorFee Creator fee share in basis points
     * @param _protocolFee Protocol fee share in basis points
     */
    function setBondingCurveFee(
        uint256 _totalFee,
        uint256 _creatorFee,
        uint256 _protocolFee
    ) external onlyRole(ADMIN_ROLE) {
        require(_totalFee <= Constants.MAX_FEE, "Fee exceeds maximum");
        require(_creatorFee + _protocolFee == _totalFee, "Fee split mismatch");

        bondingCurveFee = _totalFee;
        bondingCurveCreatorFee = _creatorFee;
        bondingCurveProtocolFee = _protocolFee;

        emit BondingCurveFeeUpdated(_totalFee, _creatorFee, _protocolFee, msg.sender);
    }

    /**
     * @notice Update post-graduation fee structure
     * @param _totalFee Total fee in basis points (creator + protocol)
     * @param _creatorFee Creator fee share in basis points
     * @param _protocolFee Protocol fee share in basis points
     */
    function setPostGraduationFee(
        uint256 _totalFee,
        uint256 _creatorFee,
        uint256 _protocolFee
    ) external onlyRole(ADMIN_ROLE) {
        require(_totalFee <= Constants.MAX_FEE, "Fee exceeds maximum");
        require(_creatorFee + _protocolFee == _totalFee, "Fee split mismatch");

        postGraduationFee = _totalFee;
        postGraduationCreatorFee = _creatorFee;
        postGraduationProtocolFee = _protocolFee;

        emit PostGraduationFeeUpdated(_totalFee, _creatorFee, _protocolFee, msg.sender);
    }

    /**
     * @notice Update protocol fee recipient address
     * @param _newRecipient New address to receive protocol fees
     */
    function setProtocolFeeRecipient(address _newRecipient) external onlyRole(ADMIN_ROLE) {
        require(_newRecipient != address(0), "Invalid recipient");
        address oldRecipient = protocolFeeRecipient;
        protocolFeeRecipient = _newRecipient;

        emit ProtocolFeeRecipientUpdated(oldRecipient, _newRecipient);
    }

    /**
     * @notice Update graduation threshold
     * @param _newThreshold New ASTER amount required for graduation
     */
    function setGraduationThreshold(uint256 _newThreshold) external onlyRole(ADMIN_ROLE) {
        require(_newThreshold > 0, "Invalid threshold");
        uint256 oldThreshold = graduationThreshold;
        graduationThreshold = _newThreshold;

        emit GraduationThresholdUpdated(oldThreshold, _newThreshold);
    }

    /**
     * @notice Pause the platform (emergency stop)
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
        emit ContractPaused(msg.sender);
    }

    /**
     * @notice Unpause the platform
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
        emit ContractUnpaused(msg.sender);
    }

    /**
     * @notice Check if platform is currently paused
     * @return bool True if paused, false otherwise
     */
    function isPaused() external view returns (bool) {
        return paused();
    }
}
