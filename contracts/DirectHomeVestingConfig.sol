pragma solidity ^0.4.18;

// ----------------------------------------------------------------------------
// Token Sale Configuration
// ----------------------------------------------------------------------------


contract DirectHomeVestingConfig  {

    uint256 public constant TARGET_TRADING_START = 1533081600; // 2018-08-01 00:00:00 UTC

    uint256 public constant PRIVATESALE_VESTING_START = TARGET_TRADING_START + 86400 * 30 * 2;
    uint256 public constant PRIVATESALE_VESTING_CLIFF = TARGET_TRADING_START + 86400 * 30 * 3;
    uint256 public constant PRIVATESALE_VESTING_DURATION = TARGET_TRADING_START + 86400 * 30 * 12;

    uint256 public constant FOUNDER_VESTING_START = TARGET_TRADING_START;
    uint256 public constant FOUNDER_VESTING_CLIFF = TARGET_TRADING_START + 86400 * 30;
    uint256 public constant FOUNDER_VESTING_DURATION = TARGET_TRADING_START + 86400 * 30 * 24;

}
