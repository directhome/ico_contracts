const DHToken = artifacts.require('DirectToken');
const DHTokenSale = artifacts.require('DirectHomeCrowdsale');
var predeployedMultisigAddress = '';

const debug = true;

var deployContractGasPrice = 1110000000;  // 1.11 gwei
module.exports = function(deployer, network) {
  if (network == 'kovan') {
    deployContractGasPrice = 1000000;     // 0.001 gwei, tested works on 21th march 2018
  } else if (network == 'ropsten') {
    predeployedMultisigAddress = '0xf7cc47a917d5f60b51ae43972c0a2318bd878539';
  }
  deployer.deploy(
    DHToken, {overwrite: false, gas: 3900000, gasPrice: deployContractGasPrice}
  ).then(() => {
    if (debug) console.log('** DHToken deployed at : ' + DHToken.address);
    return deployer.deploy(
      DHTokenSale,
      DHToken.address,
      predeployedMultisigAddress, {overwrite: false, gas: 3900000, gasPrice: deployContractGasPrice}
    ).then(() => {
      if (debug) console.log('** DHTokenSale deployed at : ' + DHTokenSale.address);
      if (debug) console.log('** Deployment completed!');
    });
  }).catch(e => console.log(e));
}
