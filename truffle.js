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
      gas: 200000,
      gasPrice: 5123456789, // 5.12 gwei for default, tested ok, 21th march 2018
    },
    kovan: {  // fast ethereum testnet, 4 sec block
      provider: function() {
        return new HDWalletProvider(mnemonic, "https://kovan.infura.io/StQ1HQ8bJaNgzDlUfIjD")
      },
      network_id: 42,
      gas: 200000,
      gasPrice: 150000000, // try 0.15 gwei, tested ok, 21th march 2018
    },
    rinkeby: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "https://rinkeby.infura.io/StQ1HQ8bJaNgzDlUfIjD")
      },
      network_id: 4,
      gas: 200000,
      gasPrice: 5250000000, // 5.25 gwei, tested ok on 21th march 2018, seems unable to complete if lower
    },


  }
};
