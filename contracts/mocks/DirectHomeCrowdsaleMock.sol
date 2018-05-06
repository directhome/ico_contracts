pragma solidity ^0.4.18;


import "../DirectHomeCrowdsale.sol";


// mock class using DirectHomeCrowdsale
contract DirectHomeCrowdsaleMock is DirectHomeCrowdsale {

  function DirectHomeCrowdsaleMock(uint256 _startTime, uint256 _endTime, uint256 _tokensPerEther, address _multisigVault) public
    DirectHomeCrowdsale(new DirectToken(), _multisigVault)
  {
    setStartTime(_startTime);
    setEndTime(_endTime);
    setTokensPerEther(_tokensPerEther);
  }

  function setSoftCap(uint _softcap) public onlyOwner {
    softcap = _softcap;
  }
}
