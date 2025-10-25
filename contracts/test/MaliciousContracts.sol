// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../BondingCurve.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title Malicious Contracts for Security Testing
 * @notice These contracts attempt various attacks for testing purposes
 * @dev DO NOT DEPLOY TO MAINNET - FOR TESTING ONLY
 */

/**
 * @notice Attempts reentrancy on buy() function
 */
contract ReentrantBuyer {
    BondingCurve public bondingCurve;
    IERC20 public asterToken;
    bool public attacking;

    constructor(address _bondingCurve, address _asterToken) {
        bondingCurve = BondingCurve(_bondingCurve);
        asterToken = IERC20(_asterToken);
    }

    function attack(uint256 amount) external {
        // Approve bonding curve
        asterToken.approve(address(bondingCurve), amount * 2);

        // Start attack
        attacking = true;
        bondingCurve.buyWithAster(amount, 0);
    }

    // This is called when the contract receives tokens
    // Attempts to buy again (reentrancy)
    receive() external payable {
        if (attacking) {
            attacking = false;
            // Attempt reentrant call
            bondingCurve.buyWithAster(1 ether, 0);
        }
    }
}

/**
 * @notice Attempts reentrancy on sell() function
 */
contract ReentrantSeller {
    BondingCurve public bondingCurve;
    IERC20 public pumpToken;
    bool public attacking;

    constructor(address _bondingCurve, address _pumpToken) {
        bondingCurve = BondingCurve(_bondingCurve);
        pumpToken = IERC20(_pumpToken);
    }

    function attack(uint256 amount) external {
        // Approve bonding curve
        pumpToken.approve(address(bondingCurve), amount * 2);

        // Start attack
        attacking = true;
        bondingCurve.sellForAster(amount, 0);
    }

    receive() external payable {
        if (attacking) {
            attacking = false;
            uint256 balance = pumpToken.balanceOf(address(this));
            if (balance > 0) {
                // Attempt reentrant call
                bondingCurve.sellForAster(balance / 2, 0);
            }
        }
    }
}

/**
 * @notice Attempts reentrancy on withdrawProtocolFees()
 */
contract ReentrantFeeWithdrawer {
    BondingCurve public bondingCurve;
    bool public attacking;

    constructor(address _bondingCurve) {
        bondingCurve = BondingCurve(_bondingCurve);
    }

    function attack() external {
        attacking = true;
        // NOTE: withdrawProtocolFees() doesn't exist in current implementation
        // This contract is kept for potential future testing
        // try bondingCurve.withdrawProtocolFees() {
        //     // Should not reach here
        // } catch {
        //     // Expected
        // }
    }

    receive() external payable {
        if (attacking) {
            attacking = false;
            // NOTE: withdrawProtocolFees() doesn't exist in current implementation
            // bondingCurve.withdrawProtocolFees();
        }
    }
}

/**
 * @notice Attempts reentrancy on createToken()
 */
contract ReentrantTokenCreator {
    address public tokenFactory;
    bool public attacking;

    constructor(address _tokenFactory) {
        tokenFactory = _tokenFactory;
    }

    function attack(string memory name, string memory symbol, string memory uri) external {
        attacking = true;
        // Attempt to create token
        (bool success,) = tokenFactory.call(
            abi.encodeWithSignature(
                "createToken(string,string,string)",
                name,
                symbol,
                uri
            )
        );
        require(success, "Initial call failed");
    }

    fallback() external payable {
        if (attacking) {
            attacking = false;
            // Attempt reentrant call
            (bool success,) = tokenFactory.call(
                abi.encodeWithSignature(
                    "createToken(string,string,string)",
                    "Reentrant",
                    "REENT",
                    "ipfs://reent"
                )
            );
        }
    }
}

/**
 * @notice Attempts cross-contract reentrancy
 */
contract CrossContractReentrancyAttacker {
    BondingCurve public bondingCurve;
    IERC20 public asterToken;
    IERC20 public pumpToken;
    bool public attacking;
    uint8 public step;

    constructor(address _bondingCurve, address _asterToken, address _pumpToken) {
        bondingCurve = BondingCurve(_bondingCurve);
        asterToken = IERC20(_asterToken);
        pumpToken = IERC20(_pumpToken);
    }

    function complexAttack(uint256 amount) external {
        asterToken.approve(address(bondingCurve), amount * 10);
        attacking = true;
        step = 0;
        bondingCurve.buyWithAster(amount, 0);
    }

    receive() external payable {
        if (attacking && step < 3) {
            step++;

            if (step == 1) {
                // Try to buy again
                bondingCurve.buyWithAster(1 ether, 0);
            } else if (step == 2) {
                // Try to sell
                uint256 balance = pumpToken.balanceOf(address(this));
                if (balance > 0) {
                    pumpToken.approve(address(bondingCurve), balance);
                    bondingCurve.sellForAster(balance / 2, 0);
                }
            } else {
                // Try to withdraw fees
                // NOTE: withdrawProtocolFees() doesn't exist in current implementation
                // try bondingCurve.withdrawProtocolFees() {} catch {}
                attacking = false;
            }
        }
    }
}

/**
 * @notice Malicious ERC20 with callback in transfer
 */
contract MaliciousERC20WithCallback {
    mapping(address => uint256) public balanceOf;
    address public attacker;

    constructor() {
        balanceOf[msg.sender] = 1000000 ether;
        attacker = msg.sender;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;

        // Malicious callback
        if (to != attacker) {
            (bool success,) = msg.sender.call(
                abi.encodeWithSignature("maliciousCallback()")
            );
        }

        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;

        // Malicious callback
        (bool success,) = msg.sender.call(
            abi.encodeWithSignature("maliciousCallback()")
        );

        return true;
    }

    function approve(address, uint256) external pure returns (bool) {
        return true;
    }

    function allowance(address, address) external pure returns (uint256) {
        return type(uint256).max;
    }
}
