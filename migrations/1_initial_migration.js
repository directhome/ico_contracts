var Migrations = artifacts.require("./Migrations.sol");

module.exports = function(deployer) {
  deployer.deploy(Migrations, { gas: 500000, gasPrice: 1110000000 });
};
