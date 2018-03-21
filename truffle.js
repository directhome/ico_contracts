require('babel-register');
require('babel-polyfill');
require('dotenv').config();
const mnemonic = process.env.MNEMONIC;
var HDWalletProvider = require('truffle-hdwallet-provider');

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*"
    },
    ropsten: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "https://ropsten.infura.io/StQ1HQ8bJaNgzDlUfIjD")
      },
      network_id: 3,
      gas: 200000,  // smaller gas by default
      gasPrice: 5123456789, // 5 gwei by default
    }

  }
};
