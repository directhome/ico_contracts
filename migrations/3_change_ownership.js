const DHToken = artifacts.require('DirectToken');
const DHTokenSale = artifacts.require('DirectHomeCrowdsale');

const saleContractOwner = '0x51DEB6be3B2166AB60e40CED2d7bea2f92d923Fd';

const debug = true;

var DHTokenInstance;
var DHTokenSaleInstance;

if (debug) console.log('^ DHToken deployed at : ' + DHToken.address);
if (debug) console.log('^ DHTokenSale deployed at : ' + DHTokenSale.address);

var DHTokenInstance = DHToken.at(DHToken.address);
var DHTokenSaleInstance = DHTokenSale.at(DHTokenSale.address);

module.exports = function(deployer) {
  deployer.then(function(){
    if (debug) console.log('Changing ownership of DHToken');
    return DHTokenInstance.transferOwnership(DHTokenSale.address);

  }).then(function(result) {
    if (debug) console.log('Changing ownership of DHTokenSaleInstance');
    return DHTokenSaleInstance.transferOwnership(saleContractOwner);
  }).then(function(result) {
    if (debug) console.log('** Ownership change completed!');
  }).catch(e => console.log(e));
}
