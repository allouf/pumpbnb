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


// File @openzeppelin/contracts/interfaces/IERC165.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (interfaces/IERC165.sol)

pragma solidity >=0.4.16;


// File @openzeppelin/contracts/token/ERC20/IERC20.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (token/ERC20/IERC20.sol)

pragma solidity >=0.4.16;

/**
 * @dev Interface of the ERC-20 standard as defined in the ERC.
 */
interface IERC20 {
    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /**
     * @dev Returns the value of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the value of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 value) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 value) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the
     * allowance mechanism. `value` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}


// File @openzeppelin/contracts/interfaces/IERC20.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (interfaces/IERC20.sol)

pragma solidity >=0.4.16;


// File @openzeppelin/contracts/interfaces/IERC1363.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (interfaces/IERC1363.sol)

pragma solidity >=0.6.2;


/**
 * @title IERC1363
 * @dev Interface of the ERC-1363 standard as defined in the https://eips.ethereum.org/EIPS/eip-1363[ERC-1363].
 *
 * Defines an extension interface for ERC-20 tokens that supports executing code on a recipient contract
 * after `transfer` or `transferFrom`, or code on a spender contract after `approve`, in a single transaction.
 */
interface IERC1363 is IERC20, IERC165 {
    /*
     * Note: the ERC-165 identifier for this interface is 0xb0202a11.
     * 0xb0202a11 ===
     *   bytes4(keccak256('transferAndCall(address,uint256)')) ^
     *   bytes4(keccak256('transferAndCall(address,uint256,bytes)')) ^
     *   bytes4(keccak256('transferFromAndCall(address,address,uint256)')) ^
     *   bytes4(keccak256('transferFromAndCall(address,address,uint256,bytes)')) ^
     *   bytes4(keccak256('approveAndCall(address,uint256)')) ^
     *   bytes4(keccak256('approveAndCall(address,uint256,bytes)'))
     */

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`
     * and then calls {IERC1363Receiver-onTransferReceived} on `to`.
     * @param to The address which you want to transfer to.
     * @param value The amount of tokens to be transferred.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function transferAndCall(address to, uint256 value) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`
     * and then calls {IERC1363Receiver-onTransferReceived} on `to`.
     * @param to The address which you want to transfer to.
     * @param value The amount of tokens to be transferred.
     * @param data Additional data with no specified format, sent in call to `to`.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function transferAndCall(address to, uint256 value, bytes calldata data) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the allowance mechanism
     * and then calls {IERC1363Receiver-onTransferReceived} on `to`.
     * @param from The address which you want to send tokens from.
     * @param to The address which you want to transfer to.
     * @param value The amount of tokens to be transferred.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function transferFromAndCall(address from, address to, uint256 value) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the allowance mechanism
     * and then calls {IERC1363Receiver-onTransferReceived} on `to`.
     * @param from The address which you want to send tokens from.
     * @param to The address which you want to transfer to.
     * @param value The amount of tokens to be transferred.
     * @param data Additional data with no specified format, sent in call to `to`.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function transferFromAndCall(address from, address to, uint256 value, bytes calldata data) external returns (bool);

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens and then calls {IERC1363Spender-onApprovalReceived} on `spender`.
     * @param spender The address which will spend the funds.
     * @param value The amount of tokens to be spent.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function approveAndCall(address spender, uint256 value) external returns (bool);

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens and then calls {IERC1363Spender-onApprovalReceived} on `spender`.
     * @param spender The address which will spend the funds.
     * @param value The amount of tokens to be spent.
     * @param data Additional data with no specified format, sent in call to `spender`.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function approveAndCall(address spender, uint256 value, bytes calldata data) external returns (bool);
}


// File @openzeppelin/contracts/interfaces/draft-IERC6093.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (interfaces/draft-IERC6093.sol)
pragma solidity >=0.8.4;

/**
 * @dev Standard ERC-20 Errors
 * Interface of the https://eips.ethereum.org/EIPS/eip-6093[ERC-6093] custom errors for ERC-20 tokens.
 */
interface IERC20Errors {
    /**
     * @dev Indicates an error related to the current `balance` of a `sender`. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     * @param balance Current balance for the interacting account.
     * @param needed Minimum amount required to perform a transfer.
     */
    error ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed);

    /**
     * @dev Indicates a failure with the token `sender`. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     */
    error ERC20InvalidSender(address sender);

    /**
     * @dev Indicates a failure with the token `receiver`. Used in transfers.
     * @param receiver Address to which tokens are being transferred.
     */
    error ERC20InvalidReceiver(address receiver);

    /**
     * @dev Indicates a failure with the `spender`’s `allowance`. Used in transfers.
     * @param spender Address that may be allowed to operate on tokens without being their owner.
     * @param allowance Amount of tokens a `spender` is allowed to operate with.
     * @param needed Minimum amount required to perform a transfer.
     */
    error ERC20InsufficientAllowance(address spender, uint256 allowance, uint256 needed);

    /**
     * @dev Indicates a failure with the `approver` of a token to be approved. Used in approvals.
     * @param approver Address initiating an approval operation.
     */
    error ERC20InvalidApprover(address approver);

    /**
     * @dev Indicates a failure with the `spender` to be approved. Used in approvals.
     * @param spender Address that may be allowed to operate on tokens without being their owner.
     */
    error ERC20InvalidSpender(address spender);
}

/**
 * @dev Standard ERC-721 Errors
 * Interface of the https://eips.ethereum.org/EIPS/eip-6093[ERC-6093] custom errors for ERC-721 tokens.
 */
interface IERC721Errors {
    /**
     * @dev Indicates that an address can't be an owner. For example, `address(0)` is a forbidden owner in ERC-20.
     * Used in balance queries.
     * @param owner Address of the current owner of a token.
     */
    error ERC721InvalidOwner(address owner);

    /**
     * @dev Indicates a `tokenId` whose `owner` is the zero address.
     * @param tokenId Identifier number of a token.
     */
    error ERC721NonexistentToken(uint256 tokenId);

    /**
     * @dev Indicates an error related to the ownership over a particular token. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     * @param tokenId Identifier number of a token.
     * @param owner Address of the current owner of a token.
     */
    error ERC721IncorrectOwner(address sender, uint256 tokenId, address owner);

    /**
     * @dev Indicates a failure with the token `sender`. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     */
    error ERC721InvalidSender(address sender);

    /**
     * @dev Indicates a failure with the token `receiver`. Used in transfers.
     * @param receiver Address to which tokens are being transferred.
     */
    error ERC721InvalidReceiver(address receiver);

    /**
     * @dev Indicates a failure with the `operator`’s approval. Used in transfers.
     * @param operator Address that may be allowed to operate on tokens without being their owner.
     * @param tokenId Identifier number of a token.
     */
    error ERC721InsufficientApproval(address operator, uint256 tokenId);

    /**
     * @dev Indicates a failure with the `approver` of a token to be approved. Used in approvals.
     * @param approver Address initiating an approval operation.
     */
    error ERC721InvalidApprover(address approver);

    /**
     * @dev Indicates a failure with the `operator` to be approved. Used in approvals.
     * @param operator Address that may be allowed to operate on tokens without being their owner.
     */
    error ERC721InvalidOperator(address operator);
}

/**
 * @dev Standard ERC-1155 Errors
 * Interface of the https://eips.ethereum.org/EIPS/eip-6093[ERC-6093] custom errors for ERC-1155 tokens.
 */
interface IERC1155Errors {
    /**
     * @dev Indicates an error related to the current `balance` of a `sender`. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     * @param balance Current balance for the interacting account.
     * @param needed Minimum amount required to perform a transfer.
     * @param tokenId Identifier number of a token.
     */
    error ERC1155InsufficientBalance(address sender, uint256 balance, uint256 needed, uint256 tokenId);

    /**
     * @dev Indicates a failure with the token `sender`. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     */
    error ERC1155InvalidSender(address sender);

    /**
     * @dev Indicates a failure with the token `receiver`. Used in transfers.
     * @param receiver Address to which tokens are being transferred.
     */
    error ERC1155InvalidReceiver(address receiver);

    /**
     * @dev Indicates a failure with the `operator`’s approval. Used in transfers.
     * @param operator Address that may be allowed to operate on tokens without being their owner.
     * @param owner Address of the current owner of a token.
     */
    error ERC1155MissingApprovalForAll(address operator, address owner);

    /**
     * @dev Indicates a failure with the `approver` of a token to be approved. Used in approvals.
     * @param approver Address initiating an approval operation.
     */
    error ERC1155InvalidApprover(address approver);

    /**
     * @dev Indicates a failure with the `operator` to be approved. Used in approvals.
     * @param operator Address that may be allowed to operate on tokens without being their owner.
     */
    error ERC1155InvalidOperator(address operator);

    /**
     * @dev Indicates an array length mismatch between ids and values in a safeBatchTransferFrom operation.
     * Used in batch transfers.
     * @param idsLength Length of the array of token identifiers
     * @param valuesLength Length of the array of token amounts
     */
    error ERC1155InvalidArrayLength(uint256 idsLength, uint256 valuesLength);
}


// File @openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (token/ERC20/extensions/IERC20Metadata.sol)

pragma solidity >=0.6.2;

/**
 * @dev Interface for the optional metadata functions from the ERC-20 standard.
 */
interface IERC20Metadata is IERC20 {
    /**
     * @dev Returns the name of the token.
     */
    function name() external view returns (string memory);

    /**
     * @dev Returns the symbol of the token.
     */
    function symbol() external view returns (string memory);

    /**
     * @dev Returns the decimals places of the token.
     */
    function decimals() external view returns (uint8);
}


// File @openzeppelin/contracts/token/ERC20/ERC20.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (token/ERC20/ERC20.sol)

pragma solidity ^0.8.20;




/**
 * @dev Implementation of the {IERC20} interface.
 *
 * This implementation is agnostic to the way tokens are created. This means
 * that a supply mechanism has to be added in a derived contract using {_mint}.
 *
 * TIP: For a detailed writeup see our guide
 * https://forum.openzeppelin.com/t/how-to-implement-erc20-supply-mechanisms/226[How
 * to implement supply mechanisms].
 *
 * The default value of {decimals} is 18. To change this, you should override
 * this function so it returns a different value.
 *
 * We have followed general OpenZeppelin Contracts guidelines: functions revert
 * instead returning `false` on failure. This behavior is nonetheless
 * conventional and does not conflict with the expectations of ERC-20
 * applications.
 */
abstract contract ERC20 is Context, IERC20, IERC20Metadata, IERC20Errors {
    mapping(address account => uint256) private _balances;

    mapping(address account => mapping(address spender => uint256)) private _allowances;

    uint256 private _totalSupply;

    string private _name;
    string private _symbol;

    /**
     * @dev Sets the values for {name} and {symbol}.
     *
     * Both values are immutable: they can only be set once during construction.
     */
    constructor(string memory name_, string memory symbol_) {
        _name = name_;
        _symbol = symbol_;
    }

    /**
     * @dev Returns the name of the token.
     */
    function name() public view virtual returns (string memory) {
        return _name;
    }

    /**
     * @dev Returns the symbol of the token, usually a shorter version of the
     * name.
     */
    function symbol() public view virtual returns (string memory) {
        return _symbol;
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     * For example, if `decimals` equals `2`, a balance of `505` tokens should
     * be displayed to a user as `5.05` (`505 / 10 ** 2`).
     *
     * Tokens usually opt for a value of 18, imitating the relationship between
     * Ether and Wei. This is the default value returned by this function, unless
     * it's overridden.
     *
     * NOTE: This information is only used for _display_ purposes: it in
     * no way affects any of the arithmetic of the contract, including
     * {IERC20-balanceOf} and {IERC20-transfer}.
     */
    function decimals() public view virtual returns (uint8) {
        return 18;
    }

    /// @inheritdoc IERC20
    function totalSupply() public view virtual returns (uint256) {
        return _totalSupply;
    }

    /// @inheritdoc IERC20
    function balanceOf(address account) public view virtual returns (uint256) {
        return _balances[account];
    }

    /**
     * @dev See {IERC20-transfer}.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - the caller must have a balance of at least `value`.
     */
    function transfer(address to, uint256 value) public virtual returns (bool) {
        address owner = _msgSender();
        _transfer(owner, to, value);
        return true;
    }

    /// @inheritdoc IERC20
    function allowance(address owner, address spender) public view virtual returns (uint256) {
        return _allowances[owner][spender];
    }

    /**
     * @dev See {IERC20-approve}.
     *
     * NOTE: If `value` is the maximum `uint256`, the allowance is not updated on
     * `transferFrom`. This is semantically equivalent to an infinite approval.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     */
    function approve(address spender, uint256 value) public virtual returns (bool) {
        address owner = _msgSender();
        _approve(owner, spender, value);
        return true;
    }

    /**
     * @dev See {IERC20-transferFrom}.
     *
     * Skips emitting an {Approval} event indicating an allowance update. This is not
     * required by the ERC. See {xref-ERC20-_approve-address-address-uint256-bool-}[_approve].
     *
     * NOTE: Does not update the allowance if the current allowance
     * is the maximum `uint256`.
     *
     * Requirements:
     *
     * - `from` and `to` cannot be the zero address.
     * - `from` must have a balance of at least `value`.
     * - the caller must have allowance for ``from``'s tokens of at least
     * `value`.
     */
    function transferFrom(address from, address to, uint256 value) public virtual returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, value);
        _transfer(from, to, value);
        return true;
    }

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to`.
     *
     * This internal function is equivalent to {transfer}, and can be used to
     * e.g. implement automatic token fees, slashing mechanisms, etc.
     *
     * Emits a {Transfer} event.
     *
     * NOTE: This function is not virtual, {_update} should be overridden instead.
     */
    function _transfer(address from, address to, uint256 value) internal {
        if (from == address(0)) {
            revert ERC20InvalidSender(address(0));
        }
        if (to == address(0)) {
            revert ERC20InvalidReceiver(address(0));
        }
        _update(from, to, value);
    }

    /**
     * @dev Transfers a `value` amount of tokens from `from` to `to`, or alternatively mints (or burns) if `from`
     * (or `to`) is the zero address. All customizations to transfers, mints, and burns should be done by overriding
     * this function.
     *
     * Emits a {Transfer} event.
     */
    function _update(address from, address to, uint256 value) internal virtual {
        if (from == address(0)) {
            // Overflow check required: The rest of the code assumes that totalSupply never overflows
            _totalSupply += value;
        } else {
            uint256 fromBalance = _balances[from];
            if (fromBalance < value) {
                revert ERC20InsufficientBalance(from, fromBalance, value);
            }
            unchecked {
                // Overflow not possible: value <= fromBalance <= totalSupply.
                _balances[from] = fromBalance - value;
            }
        }

        if (to == address(0)) {
            unchecked {
                // Overflow not possible: value <= totalSupply or value <= fromBalance <= totalSupply.
                _totalSupply -= value;
            }
        } else {
            unchecked {
                // Overflow not possible: balance + value is at most totalSupply, which we know fits into a uint256.
                _balances[to] += value;
            }
        }

        emit Transfer(from, to, value);
    }

    /**
     * @dev Creates a `value` amount of tokens and assigns them to `account`, by transferring it from address(0).
     * Relies on the `_update` mechanism
     *
     * Emits a {Transfer} event with `from` set to the zero address.
     *
     * NOTE: This function is not virtual, {_update} should be overridden instead.
     */
    function _mint(address account, uint256 value) internal {
        if (account == address(0)) {
            revert ERC20InvalidReceiver(address(0));
        }
        _update(address(0), account, value);
    }

    /**
     * @dev Destroys a `value` amount of tokens from `account`, lowering the total supply.
     * Relies on the `_update` mechanism.
     *
     * Emits a {Transfer} event with `to` set to the zero address.
     *
     * NOTE: This function is not virtual, {_update} should be overridden instead
     */
    function _burn(address account, uint256 value) internal {
        if (account == address(0)) {
            revert ERC20InvalidSender(address(0));
        }
        _update(account, address(0), value);
    }

    /**
     * @dev Sets `value` as the allowance of `spender` over the `owner`'s tokens.
     *
     * This internal function is equivalent to `approve`, and can be used to
     * e.g. set automatic allowances for certain subsystems, etc.
     *
     * Emits an {Approval} event.
     *
     * Requirements:
     *
     * - `owner` cannot be the zero address.
     * - `spender` cannot be the zero address.
     *
     * Overrides to this logic should be done to the variant with an additional `bool emitEvent` argument.
     */
    function _approve(address owner, address spender, uint256 value) internal {
        _approve(owner, spender, value, true);
    }

    /**
     * @dev Variant of {_approve} with an optional flag to enable or disable the {Approval} event.
     *
     * By default (when calling {_approve}) the flag is set to true. On the other hand, approval changes made by
     * `_spendAllowance` during the `transferFrom` operation set the flag to false. This saves gas by not emitting any
     * `Approval` event during `transferFrom` operations.
     *
     * Anyone who wishes to continue emitting `Approval` events on the`transferFrom` operation can force the flag to
     * true using the following override:
     *
     * ```solidity
     * function _approve(address owner, address spender, uint256 value, bool) internal virtual override {
     *     super._approve(owner, spender, value, true);
     * }
     * ```
     *
     * Requirements are the same as {_approve}.
     */
    function _approve(address owner, address spender, uint256 value, bool emitEvent) internal virtual {
        if (owner == address(0)) {
            revert ERC20InvalidApprover(address(0));
        }
        if (spender == address(0)) {
            revert ERC20InvalidSpender(address(0));
        }
        _allowances[owner][spender] = value;
        if (emitEvent) {
            emit Approval(owner, spender, value);
        }
    }

    /**
     * @dev Updates `owner`'s allowance for `spender` based on spent `value`.
     *
     * Does not update the allowance value in case of infinite allowance.
     * Revert if not enough allowance is available.
     *
     * Does not emit an {Approval} event.
     */
    function _spendAllowance(address owner, address spender, uint256 value) internal virtual {
        uint256 currentAllowance = allowance(owner, spender);
        if (currentAllowance < type(uint256).max) {
            if (currentAllowance < value) {
                revert ERC20InsufficientAllowance(spender, currentAllowance, value);
            }
            unchecked {
                _approve(owner, spender, currentAllowance - value, false);
            }
        }
    }
}


// File @openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.3.0) (token/ERC20/utils/SafeERC20.sol)

pragma solidity ^0.8.20;


/**
 * @title SafeERC20
 * @dev Wrappers around ERC-20 operations that throw on failure (when the token
 * contract returns false). Tokens that return no value (and instead revert or
 * throw on failure) are also supported, non-reverting calls are assumed to be
 * successful.
 * To use this library you can add a `using SafeERC20 for IERC20;` statement to your contract,
 * which allows you to call the safe operations as `token.safeTransfer(...)`, etc.
 */
library SafeERC20 {
    /**
     * @dev An operation with an ERC-20 token failed.
     */
    error SafeERC20FailedOperation(address token);

    /**
     * @dev Indicates a failed `decreaseAllowance` request.
     */
    error SafeERC20FailedDecreaseAllowance(address spender, uint256 currentAllowance, uint256 requestedDecrease);

    /**
     * @dev Transfer `value` amount of `token` from the calling contract to `to`. If `token` returns no value,
     * non-reverting calls are assumed to be successful.
     */
    function safeTransfer(IERC20 token, address to, uint256 value) internal {
        _callOptionalReturn(token, abi.encodeCall(token.transfer, (to, value)));
    }

    /**
     * @dev Transfer `value` amount of `token` from `from` to `to`, spending the approval given by `from` to the
     * calling contract. If `token` returns no value, non-reverting calls are assumed to be successful.
     */
    function safeTransferFrom(IERC20 token, address from, address to, uint256 value) internal {
        _callOptionalReturn(token, abi.encodeCall(token.transferFrom, (from, to, value)));
    }

    /**
     * @dev Variant of {safeTransfer} that returns a bool instead of reverting if the operation is not successful.
     */
    function trySafeTransfer(IERC20 token, address to, uint256 value) internal returns (bool) {
        return _callOptionalReturnBool(token, abi.encodeCall(token.transfer, (to, value)));
    }

    /**
     * @dev Variant of {safeTransferFrom} that returns a bool instead of reverting if the operation is not successful.
     */
    function trySafeTransferFrom(IERC20 token, address from, address to, uint256 value) internal returns (bool) {
        return _callOptionalReturnBool(token, abi.encodeCall(token.transferFrom, (from, to, value)));
    }

    /**
     * @dev Increase the calling contract's allowance toward `spender` by `value`. If `token` returns no value,
     * non-reverting calls are assumed to be successful.
     *
     * IMPORTANT: If the token implements ERC-7674 (ERC-20 with temporary allowance), and if the "client"
     * smart contract uses ERC-7674 to set temporary allowances, then the "client" smart contract should avoid using
     * this function. Performing a {safeIncreaseAllowance} or {safeDecreaseAllowance} operation on a token contract
     * that has a non-zero temporary allowance (for that particular owner-spender) will result in unexpected behavior.
     */
    function safeIncreaseAllowance(IERC20 token, address spender, uint256 value) internal {
        uint256 oldAllowance = token.allowance(address(this), spender);
        forceApprove(token, spender, oldAllowance + value);
    }

    /**
     * @dev Decrease the calling contract's allowance toward `spender` by `requestedDecrease`. If `token` returns no
     * value, non-reverting calls are assumed to be successful.
     *
     * IMPORTANT: If the token implements ERC-7674 (ERC-20 with temporary allowance), and if the "client"
     * smart contract uses ERC-7674 to set temporary allowances, then the "client" smart contract should avoid using
     * this function. Performing a {safeIncreaseAllowance} or {safeDecreaseAllowance} operation on a token contract
     * that has a non-zero temporary allowance (for that particular owner-spender) will result in unexpected behavior.
     */
    function safeDecreaseAllowance(IERC20 token, address spender, uint256 requestedDecrease) internal {
        unchecked {
            uint256 currentAllowance = token.allowance(address(this), spender);
            if (currentAllowance < requestedDecrease) {
                revert SafeERC20FailedDecreaseAllowance(spender, currentAllowance, requestedDecrease);
            }
            forceApprove(token, spender, currentAllowance - requestedDecrease);
        }
    }

    /**
     * @dev Set the calling contract's allowance toward `spender` to `value`. If `token` returns no value,
     * non-reverting calls are assumed to be successful. Meant to be used with tokens that require the approval
     * to be set to zero before setting it to a non-zero value, such as USDT.
     *
     * NOTE: If the token implements ERC-7674, this function will not modify any temporary allowance. This function
     * only sets the "standard" allowance. Any temporary allowance will remain active, in addition to the value being
     * set here.
     */
    function forceApprove(IERC20 token, address spender, uint256 value) internal {
        bytes memory approvalCall = abi.encodeCall(token.approve, (spender, value));

        if (!_callOptionalReturnBool(token, approvalCall)) {
            _callOptionalReturn(token, abi.encodeCall(token.approve, (spender, 0)));
            _callOptionalReturn(token, approvalCall);
        }
    }

    /**
     * @dev Performs an {ERC1363} transferAndCall, with a fallback to the simple {ERC20} transfer if the target has no
     * code. This can be used to implement an {ERC721}-like safe transfer that rely on {ERC1363} checks when
     * targeting contracts.
     *
     * Reverts if the returned value is other than `true`.
     */
    function transferAndCallRelaxed(IERC1363 token, address to, uint256 value, bytes memory data) internal {
        if (to.code.length == 0) {
            safeTransfer(token, to, value);
        } else if (!token.transferAndCall(to, value, data)) {
            revert SafeERC20FailedOperation(address(token));
        }
    }

    /**
     * @dev Performs an {ERC1363} transferFromAndCall, with a fallback to the simple {ERC20} transferFrom if the target
     * has no code. This can be used to implement an {ERC721}-like safe transfer that rely on {ERC1363} checks when
     * targeting contracts.
     *
     * Reverts if the returned value is other than `true`.
     */
    function transferFromAndCallRelaxed(
        IERC1363 token,
        address from,
        address to,
        uint256 value,
        bytes memory data
    ) internal {
        if (to.code.length == 0) {
            safeTransferFrom(token, from, to, value);
        } else if (!token.transferFromAndCall(from, to, value, data)) {
            revert SafeERC20FailedOperation(address(token));
        }
    }

    /**
     * @dev Performs an {ERC1363} approveAndCall, with a fallback to the simple {ERC20} approve if the target has no
     * code. This can be used to implement an {ERC721}-like safe transfer that rely on {ERC1363} checks when
     * targeting contracts.
     *
     * NOTE: When the recipient address (`to`) has no code (i.e. is an EOA), this function behaves as {forceApprove}.
     * Opposedly, when the recipient address (`to`) has code, this function only attempts to call {ERC1363-approveAndCall}
     * once without retrying, and relies on the returned value to be true.
     *
     * Reverts if the returned value is other than `true`.
     */
    function approveAndCallRelaxed(IERC1363 token, address to, uint256 value, bytes memory data) internal {
        if (to.code.length == 0) {
            forceApprove(token, to, value);
        } else if (!token.approveAndCall(to, value, data)) {
            revert SafeERC20FailedOperation(address(token));
        }
    }

    /**
     * @dev Imitates a Solidity high-level call (i.e. a regular function call to a contract), relaxing the requirement
     * on the return value: the return value is optional (but if data is returned, it must not be false).
     * @param token The token targeted by the call.
     * @param data The call data (encoded using abi.encode or one of its variants).
     *
     * This is a variant of {_callOptionalReturnBool} that reverts if call fails to meet the requirements.
     */
    function _callOptionalReturn(IERC20 token, bytes memory data) private {
        uint256 returnSize;
        uint256 returnValue;
        assembly ("memory-safe") {
            let success := call(gas(), token, 0, add(data, 0x20), mload(data), 0, 0x20)
            // bubble errors
            if iszero(success) {
                let ptr := mload(0x40)
                returndatacopy(ptr, 0, returndatasize())
                revert(ptr, returndatasize())
            }
            returnSize := returndatasize()
            returnValue := mload(0)
        }

        if (returnSize == 0 ? address(token).code.length == 0 : returnValue != 1) {
            revert SafeERC20FailedOperation(address(token));
        }
    }

    /**
     * @dev Imitates a Solidity high-level call (i.e. a regular function call to a contract), relaxing the requirement
     * on the return value: the return value is optional (but if data is returned, it must not be false).
     * @param token The token targeted by the call.
     * @param data The call data (encoded using abi.encode or one of its variants).
     *
     * This is a variant of {_callOptionalReturn} that silently catches all reverts and returns a bool instead.
     */
    function _callOptionalReturnBool(IERC20 token, bytes memory data) private returns (bool) {
        bool success;
        uint256 returnSize;
        uint256 returnValue;
        assembly ("memory-safe") {
            success := call(gas(), token, 0, add(data, 0x20), mload(data), 0, 0x20)
            returnSize := returndatasize()
            returnValue := mload(0)
        }
        return success && (returnSize == 0 ? address(token).code.length > 0 : returnValue == 1);
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


// File @openzeppelin/contracts/utils/ReentrancyGuard.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (utils/ReentrancyGuard.sol)

pragma solidity ^0.8.20;

/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 *
 * Inheriting from `ReentrancyGuard` will make the {nonReentrant} modifier
 * available, which can be applied to functions to make sure there are no nested
 * (reentrant) calls to them.
 *
 * Note that because there is a single `nonReentrant` guard, functions marked as
 * `nonReentrant` may not call one another. This can be worked around by making
 * those functions `private`, and then adding `external` `nonReentrant` entry
 * points to them.
 *
 * TIP: If EIP-1153 (transient storage) is available on the chain you're deploying at,
 * consider using {ReentrancyGuardTransient} instead.
 *
 * TIP: If you would like to learn more about reentrancy and alternative ways
 * to protect against it, check out our blog post
 * https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul].
 */
abstract contract ReentrancyGuard {
    // Booleans are more expensive than uint256 or any type that takes up a full
    // word because each write operation emits an extra SLOAD to first read the
    // slot's contents, replace the bits taken up by the boolean, and then write
    // back. This is the compiler's defense against contract upgrades and
    // pointer aliasing, and it cannot be disabled.

    // The values being non-zero value makes deployment a bit more expensive,
    // but in exchange the refund on every call to nonReentrant will be lower in
    // amount. Since refunds are capped to a percentage of the total
    // transaction's gas, it is best to keep them low in cases like this one, to
    // increase the likelihood of the full refund coming into effect.
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;

    uint256 private _status;

    /**
     * @dev Unauthorized reentrant call.
     */
    error ReentrancyGuardReentrantCall();

    constructor() {
        _status = NOT_ENTERED;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and making it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() private {
        // On the first call to nonReentrant, _status will be NOT_ENTERED
        if (_status == ENTERED) {
            revert ReentrancyGuardReentrantCall();
        }

        // Any calls to nonReentrant after this point will fail
        _status = ENTERED;
    }

    function _nonReentrantAfter() private {
        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _status = NOT_ENTERED;
    }

    /**
     * @dev Returns true if the reentrancy guard is currently set to "entered", which indicates there is a
     * `nonReentrant` function in the call stack.
     */
    function _reentrancyGuardEntered() internal view returns (bool) {
        return _status == ENTERED;
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


// File contracts/interfaces/IASTER.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IASTER
 * @notice Interface for the ASTER token (standard BEP-20/ERC-20)
 * @dev ASTER token address: 0x000Ae314E2A2172a039B26378814C252734f556A
 */
interface IASTER is IERC20 {
    // Standard ERC20 interface - no additional functions needed
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


// File contracts/PumpToken.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.20;


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


// File contracts/BondingCurve.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.20;







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
     */
    constructor(
        address _token,
        address _creator,
        address _config,
        uint256 _virtualAsterReserve
    ) {
        require(_token != address(0), "Invalid token");
        require(_creator != address(0), "Invalid creator");
        require(_config != address(0), "Invalid config");
        require(_virtualAsterReserve > 0, "Invalid virtual reserve");

        token = PumpToken(_token);
        creator = _creator;
        config = PlatformConfig(_config);
        asterToken = IASTER(Constants.ASTER_TOKEN);
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


// File contracts/TokenFactory.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.20;






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

    /// @notice Virtual ASTER reserve for bonding curves (equivalent to 0.3 BNB in ASTER)
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

        // Deploy bonding curve with token address
        BondingCurve curve = new BondingCurve(
            tokenAddress,
            msg.sender,
            address(config),
            virtualAsterReserve
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
