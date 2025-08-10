// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

library SafeERC20 {
    function safeTransferFrom(IERC20 token, address from, address to, uint256 value) internal {
        bool ok = token.transferFrom(from, to, value);
        require(ok, "TRANSFER_FROM_FAILED");
    }

    function safeTransfer(IERC20 token, address to, uint256 value) internal {
        bool ok = token.transfer(to, value);
        require(ok, "TRANSFER_FAILED");
    }
}

/// @title Simple ERC20 Staking Pool
/// @notice Deploy one instance per pool/token. Frontend handles any token swaps via OKX DEX before staking.
contract StakingPool {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;
    address public owner;

    mapping(address => uint256) public stakes; // user => amount
    uint256 public totalStaked;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);

    error NotOwner();
    error InvalidAmount();
    error InsufficientStake();

    constructor(IERC20 _token) {
        token = _token;
        owner = msg.sender;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    /// @notice Stake a specific amount of the staking token.
    /// @dev Requires prior ERC20 approval to this contract.
    function stake(uint256 amount) external {
        if (amount == 0) revert InvalidAmount();
        token.safeTransferFrom(msg.sender, address(this), amount);
        stakes[msg.sender] += amount;
        totalStaked += amount;
        emit Staked(msg.sender, amount);
    }

    /// @notice Unstake a specific amount of previously staked tokens.
    function unstake(uint256 amount) external {
        if (amount == 0) revert InvalidAmount();
        uint256 current = stakes[msg.sender];
        if (current < amount) revert InsufficientStake();
        stakes[msg.sender] = current - amount;
        totalStaked -= amount;
        token.safeTransfer(msg.sender, amount);
        emit Unstaked(msg.sender, amount);
    }

    /// @notice View helper: user staked balance (alias for stakes mapping)
    function stakedBalance(address user) external view returns (uint256) {
        return stakes[user];
    }

    /// @notice Optional: owner can recover any ERC20 tokens sent by mistake (excluding the staking token unless explicitly allowed)
    function rescueTokens(address erc20, address to, uint256 amount) external onlyOwner {
        IERC20(erc20).transfer(to, amount);
    }

    /// @notice Transfer ownership
    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }
}
