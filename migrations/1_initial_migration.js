var Migrations = artifacts.require("./Migrations.sol");
var deployContractGasPrice = 31110000000;  
module.exports = function(deployer, network) {
  if (network == 'kovan') {
    deployContractGasPrice = 1000000;     // 0.001 gwei, tested works on 21th march 2018
  }
  deployer.deploy(Migrations, { gas: 500000, gasPrice: deployContractGasPrice });
};
