const DHToken = artifacts.require('DirectToken');
const DHTokenSale = artifacts.require('DirectHomeCrowdsale');
const predeployedMultisigAddressOnRopsten = '0xf7cc47a917d5f60b51ae43972c0a2318bd878539';
// the below to be updated before running on target network
const predeployedMultisigAddress = predeployedMultisigAddressOnRopsten;

const debug = true;

module.exports = function(deployer) {
  deployer.deploy(
    DHToken, {overwrite: false, gas: 3900000, gasPrice: 1110000000}
  ).then(() => {
    if (debug) console.log('** DHToken deployed at : ' + DHToken.address);
    return deployer.deploy(
      DHTokenSale,
      DHToken.address,
      predeployedMultisigAddress, {overwrite: false, gas: 3900000, gasPrice: 1110000000}
    ).then(() => {
      if (debug) console.log('** DHTokenSale deployed at : ' + DHTokenSale.address);
      if (debug) console.log('** Deployment completed!');
    });
  }).catch(e => console.log(e));
}
