// Sources flattened with hardhat v2.26.3 https://hardhat.org

// SPDX-License-Identifier: MIT

// File @openzeppelin/contracts/access/IAccessControl.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (access/IAccessControl.sol)

pragma solidity >=0.8.4;

/**
 * @dev External interface of AccessControl declared to support ERC-165 detection.
 */
interface IAccessControl {
    /**
     * @dev The `account` is missing a role.
     */
    error AccessControlUnauthorizedAccount(address account, bytes32 neededRole);

    /**
     * @dev The caller of a function is not the expected one.
     *
     * NOTE: Don't confuse with {AccessControlUnauthorizedAccount}.
     */
    error AccessControlBadConfirmation();

    /**
     * @dev Emitted when `newAdminRole` is set as ``role``'s admin role, replacing `previousAdminRole`
     *
     * `DEFAULT_ADMIN_ROLE` is the starting admin for all roles, despite
     * {RoleAdminChanged} not being emitted to signal this.
     */
    event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole);

    /**
     * @dev Emitted when `account` is granted `role`.
     *
     * `sender` is the account that originated the contract call. This account bears the admin role (for the granted role).
     * Expected in cases where the role was granted using the internal {AccessControl-_grantRole}.
     */
    event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);

    /**
     * @dev Emitted when `account` is revoked `role`.
     *
     * `sender` is the account that originated the contract call:
     *   - if using `revokeRole`, it is the admin role bearer
     *   - if using `renounceRole`, it is the role bearer (i.e. `account`)
     */
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);

    /**
     * @dev Returns `true` if `account` has been granted `role`.
     */
    function hasRole(bytes32 role, address account) external view returns (bool);

    /**
     * @dev Returns the admin role that controls `role`. See {grantRole} and
     * {revokeRole}.
     *
     * To change a role's admin, use {AccessControl-_setRoleAdmin}.
     */
    function getRoleAdmin(bytes32 role) external view returns (bytes32);

    /**
     * @dev Grants `role` to `account`.
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     */
    function grantRole(bytes32 role, address account) external;

    /**
     * @dev Revokes `role` from `account`.
     *
     * If `account` had been granted `role`, emits a {RoleRevoked} event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     */
    function revokeRole(bytes32 role, address account) external;

    /**
     * @dev Revokes `role` from the calling account.
     *
     * Roles are often managed via {grantRole} and {revokeRole}: this function's
     * purpose is to provide a mechanism for accounts to lose their privileges
     * if they are compromised (such as when a trusted device is misplaced).
     *
     * If the calling account had been granted `role`, emits a {RoleRevoked}
     * event.
     *
     * Requirements:
     *
     * - the caller must be `callerConfirmation`.
     */
    function renounceRole(bytes32 role, address callerConfirmation) external;
}


// File @openzeppelin/contracts/utils/Context.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.1) (utils/Context.sol)

pragma solidity ^0.8.20;

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}


// File @openzeppelin/contracts/utils/introspection/IERC165.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (utils/introspection/IERC165.sol)

pragma solidity >=0.4.16;

/**
 * @dev Interface of the ERC-165 standard, as defined in the
 * https://eips.ethereum.org/EIPS/eip-165[ERC].
 *
 * Implementers can declare support of contract interfaces, which can then be
 * queried by others ({ERC165Checker}).
 *
 * For an implementation, see {ERC165}.
 */
interface IERC165 {
    /**
     * @dev Returns true if this contract implements the interface defined by
     * `interfaceId`. See the corresponding
     * https://eips.ethereum.org/EIPS/eip-165#how-interfaces-are-identified[ERC section]
     * to learn more about how these ids are created.
     *
     * This function call must use less than 30 000 gas.
     */
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}


// File @openzeppelin/contracts/utils/introspection/ERC165.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (utils/introspection/ERC165.sol)

pragma solidity ^0.8.20;

/**
 * @dev Implementation of the {IERC165} interface.
 *
 * Contracts that want to implement ERC-165 should inherit from this contract and override {supportsInterface} to check
 * for the additional interface id that will be supported. For example:
 *
 * ```solidity
 * function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
 *     return interfaceId == type(MyInterface).interfaceId || super.supportsInterface(interfaceId);
 * }
 * ```
 */
abstract contract ERC165 is IERC165 {
    /// @inheritdoc IERC165
    function supportsInterface(bytes4 interfaceId) public view virtual returns (bool) {
        return interfaceId == type(IERC165).interfaceId;
    }
}


// File @openzeppelin/contracts/access/AccessControl.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (access/AccessControl.sol)

pragma solidity ^0.8.20;



/**
 * @dev Contract module that allows children to implement role-based access
 * control mechanisms. This is a lightweight version that doesn't allow enumerating role
 * members except through off-chain means by accessing the contract event logs. Some
 * applications may benefit from on-chain enumerability, for those cases see
 * {AccessControlEnumerable}.
 *
 * Roles are referred to by their `bytes32` identifier. These should be exposed
 * in the external API and be unique. The best way to achieve this is by
 * using `public constant` hash digests:
 *
 * ```solidity
 * bytes32 public constant MY_ROLE = keccak256("MY_ROLE");
 * ```
 *
 * Roles can be used to represent a set of permissions. To restrict access to a
 * function call, use {hasRole}:
 *
 * ```solidity
 * function foo() public {
 *     require(hasRole(MY_ROLE, msg.sender));
 *     ...
 * }
 * ```
 *
 * Roles can be granted and revoked dynamically via the {grantRole} and
 * {revokeRole} functions. Each role has an associated admin role, and only
 * accounts that have a role's admin role can call {grantRole} and {revokeRole}.
 *
 * By default, the admin role for all roles is `DEFAULT_ADMIN_ROLE`, which means
 * that only accounts with this role will be able to grant or revoke other
 * roles. More complex role relationships can be created by using
 * {_setRoleAdmin}.
 *
 * WARNING: The `DEFAULT_ADMIN_ROLE` is also its own admin: it has permission to
 * grant and revoke this role. Extra precautions should be taken to secure
 * accounts that have been granted it. We recommend using {AccessControlDefaultAdminRules}
 * to enforce additional security measures for this role.
 */
abstract contract AccessControl is Context, IAccessControl, ERC165 {
    struct RoleData {
        mapping(address account => bool) hasRole;
        bytes32 adminRole;
    }

    mapping(bytes32 role => RoleData) private _roles;

    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;

    /**
     * @dev Modifier that checks that an account has a specific role. Reverts
     * with an {AccessControlUnauthorizedAccount} error including the required role.
     */
    modifier onlyRole(bytes32 role) {
        _checkRole(role);
        _;
    }

    /// @inheritdoc IERC165
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IAccessControl).interfaceId || super.supportsInterface(interfaceId);
    }

    /**
     * @dev Returns `true` if `account` has been granted `role`.
     */
    function hasRole(bytes32 role, address account) public view virtual returns (bool) {
        return _roles[role].hasRole[account];
    }

    /**
     * @dev Reverts with an {AccessControlUnauthorizedAccount} error if `_msgSender()`
     * is missing `role`. Overriding this function changes the behavior of the {onlyRole} modifier.
     */
    function _checkRole(bytes32 role) internal view virtual {
        _checkRole(role, _msgSender());
    }

    /**
     * @dev Reverts with an {AccessControlUnauthorizedAccount} error if `account`
     * is missing `role`.
     */
    function _checkRole(bytes32 role, address account) internal view virtual {
        if (!hasRole(role, account)) {
            revert AccessControlUnauthorizedAccount(account, role);
        }
    }

    /**
     * @dev Returns the admin role that controls `role`. See {grantRole} and
     * {revokeRole}.
     *
     * To change a role's admin, use {_setRoleAdmin}.
     */
    function getRoleAdmin(bytes32 role) public view virtual returns (bytes32) {
        return _roles[role].adminRole;
    }

    /**
     * @dev Grants `role` to `account`.
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     *
     * May emit a {RoleGranted} event.
     */
    function grantRole(bytes32 role, address account) public virtual onlyRole(getRoleAdmin(role)) {
        _grantRole(role, account);
    }

    /**
     * @dev Revokes `role` from `account`.
     *
     * If `account` had been granted `role`, emits a {RoleRevoked} event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     *
     * May emit a {RoleRevoked} event.
     */
    function revokeRole(bytes32 role, address account) public virtual onlyRole(getRoleAdmin(role)) {
        _revokeRole(role, account);
    }

    /**
     * @dev Revokes `role` from the calling account.
     *
     * Roles are often managed via {grantRole} and {revokeRole}: this function's
     * purpose is to provide a mechanism for accounts to lose their privileges
     * if they are compromised (such as when a trusted device is misplaced).
     *
     * If the calling account had been revoked `role`, emits a {RoleRevoked}
     * event.
     *
     * Requirements:
     *
     * - the caller must be `callerConfirmation`.
     *
     * May emit a {RoleRevoked} event.
     */
    function renounceRole(bytes32 role, address callerConfirmation) public virtual {
        if (callerConfirmation != _msgSender()) {
            revert AccessControlBadConfirmation();
        }

        _revokeRole(role, callerConfirmation);
    }

    /**
     * @dev Sets `adminRole` as ``role``'s admin role.
     *
     * Emits a {RoleAdminChanged} event.
     */
    function _setRoleAdmin(bytes32 role, bytes32 adminRole) internal virtual {
        bytes32 previousAdminRole = getRoleAdmin(role);
        _roles[role].adminRole = adminRole;
        emit RoleAdminChanged(role, previousAdminRole, adminRole);
    }

    /**
     * @dev Attempts to grant `role` to `account` and returns a boolean indicating if `role` was granted.
     *
     * Internal function without access restriction.
     *
     * May emit a {RoleGranted} event.
     */
    function _grantRole(bytes32 role, address account) internal virtual returns (bool) {
        if (!hasRole(role, account)) {
            _roles[role].hasRole[account] = true;
            emit RoleGranted(role, account, _msgSender());
            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev Attempts to revoke `role` from `account` and returns a boolean indicating if `role` was revoked.
     *
     * Internal function without access restriction.
     *
     * May emit a {RoleRevoked} event.
     */
    function _revokeRole(bytes32 role, address account) internal virtual returns (bool) {
        if (hasRole(role, account)) {
            _roles[role].hasRole[account] = false;
            emit RoleRevoked(role, account, _msgSender());
            return true;
        } else {
            return false;
        }
    }
}


// File @openzeppelin/contracts/utils/Pausable.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.3.0) (utils/Pausable.sol)

pragma solidity ^0.8.20;

/**
 * @dev Contract module which allows children to implement an emergency stop
 * mechanism that can be triggered by an authorized account.
 *
 * This module is used through inheritance. It will make available the
 * modifiers `whenNotPaused` and `whenPaused`, which can be applied to
 * the functions of your contract. Note that they will not be pausable by
 * simply including this module, only once the modifiers are put in place.
 */
abstract contract Pausable is Context {
    bool private _paused;

    /**
     * @dev Emitted when the pause is triggered by `account`.
     */
    event Paused(address account);

    /**
     * @dev Emitted when the pause is lifted by `account`.
     */
    event Unpaused(address account);

    /**
     * @dev The operation failed because the contract is paused.
     */
    error EnforcedPause();

    /**
     * @dev The operation failed because the contract is not paused.
     */
    error ExpectedPause();

    /**
     * @dev Modifier to make a function callable only when the contract is not paused.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    modifier whenNotPaused() {
        _requireNotPaused();
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is paused.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    modifier whenPaused() {
        _requirePaused();
        _;
    }

    /**
     * @dev Returns true if the contract is paused, and false otherwise.
     */
    function paused() public view virtual returns (bool) {
        return _paused;
    }

    /**
     * @dev Throws if the contract is paused.
     */
    function _requireNotPaused() internal view virtual {
        if (paused()) {
            revert EnforcedPause();
        }
    }

    /**
     * @dev Throws if the contract is not paused.
     */
    function _requirePaused() internal view virtual {
        if (!paused()) {
            revert ExpectedPause();
        }
    }

    /**
     * @dev Triggers stopped state.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    function _pause() internal virtual whenNotPaused {
        _paused = true;
        emit Paused(_msgSender());
    }

    /**
     * @dev Returns to normal state.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    function _unpause() internal virtual whenPaused {
        _paused = false;
        emit Unpaused(_msgSender());
    }
}


// File contracts/Constants.sol

// Original license: SPDX_License_Identifier: MIT
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

    /// @notice Default graduation threshold (100 ASTER)
    uint256 public constant DEFAULT_GRADUATION_THRESHOLD = 100 ether;

    /// @notice Maximum allowed fee (500 bps = 5%)
    uint256 public constant MAX_FEE = 500;

    /// @notice Total token supply (1 billion tokens)
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 ether;

    /// @notice Bonding curve allocation (800 million tokens = 80%)
    uint256 public constant BONDING_CURVE_SUPPLY = 800_000_000 ether;

    /// @notice Creator allocation (200 million tokens = 20%)
    uint256 public constant CREATOR_SUPPLY = 200_000_000 ether;

    /// @notice Virtual token reserve for bonding curve (200 million tokens)
    uint256 public constant VIRTUAL_TOKEN_RESERVE = 200_000_000 ether;

    /// @notice Basis points denominator (10000 = 100%)
    uint256 public constant BPS_DENOMINATOR = 10000;
}


// File contracts/PlatformConfig.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.20;



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
