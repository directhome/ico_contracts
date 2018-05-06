import ether from './helpers/ether';
import { advanceBlock } from './helpers/advanceToBlock';
import { increaseTimeTo, duration } from './helpers/increaseTime';
import latestTime from './helpers/latestTime';
import EVMRevert from './helpers/EVMRevert';

const BigNumber = web3.BigNumber;

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const Crowdsale = artifacts.require('DirectHomeCrowdsale');
const CrowdsaleMock = artifacts.require('DirectHomeCrowdsaleMock');
const DirectToken = artifacts.require('DirectToken');

contract('DirectHomeCrowdsale', function ([_, owner, investor, wallet, purchaser, thirdparty]) {
  const tokensPerEther = new BigNumber(1000);
  const value = ether(1.2);

  const expectedTokenAmount = tokensPerEther.mul(value);

  const hardcap = ether(3);
  const lessThanCap = ether(2.5);


  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock();
  });

  var DHTokenInstance = DirectToken.at(DirectToken.address);
  var DHTokenSaleInstance = Crowdsale.at(Crowdsale.address);

  beforeEach(async function () {
    this.startTime = latestTime() + duration.weeks(1);
    this.endTime = this.startTime + duration.weeks(1);
    this.afterEndTime = this.endTime + duration.seconds(1);

    this.crowdsale = await CrowdsaleMock.new(this.startTime, this.endTime, tokensPerEther, wallet, { from: owner });

    this.token = DirectToken.at(await this.crowdsale.token());
  });

  it('should be token owner by default', async function () {
    const owner = await DHTokenInstance.owner();
    owner.should.equal(DHTokenSaleInstance.address);
  });

  it('should be token owner', async function () {
    const owner = await this.token.owner();
    owner.should.equal(this.crowdsale.address);
  });

  it('should be ended only after end', async function () {
    let ended = await this.crowdsale.hasSaleEnded();
    ended.should.equal(false);
    await increaseTimeTo(this.afterEndTime);
    ended = await this.crowdsale.hasSaleEnded();
    ended.should.equal(true);
  });

  describe('accepting payments', function () {
    it('should reject payments before start', async function () {
      await this.crowdsale.send(value).should.be.rejectedWith(EVMRevert);
      await this.crowdsale.buyTokens(investor, { from: purchaser, value: value }).should.be.rejectedWith(EVMRevert);
    });

    it('should accept payments after start', async function () {
      await increaseTimeTo(this.startTime);
      await this.crowdsale.send(value).should.be.fulfilled;
      await this.crowdsale.buyTokens(investor, { value: value, from: purchaser }).should.be.fulfilled;
    });

    it('should reject payments after end', async function () {
      await increaseTimeTo(this.afterEndTime);
      await this.crowdsale.send(value).should.be.rejectedWith(EVMRevert);
      await this.crowdsale.buyTokens(investor, { value: value, from: purchaser }).should.be.rejectedWith(EVMRevert);
    });

    // hardcap related
    it('should accept payments within hardcap', async function () {
      await this.crowdsale.setHardCap(hardcap, { from: owner });
      await increaseTimeTo(this.startTime);
      await this.crowdsale.send(hardcap.minus(lessThanCap)).should.be.fulfilled;
      await this.crowdsale.send(lessThanCap).should.be.fulfilled;
    });

    it('should reject payments outside hardcap', async function () {
      await this.crowdsale.setHardCap(hardcap, { from: owner });
      await increaseTimeTo(this.startTime);
      await this.crowdsale.send(hardcap);
      await this.crowdsale.send(1).should.be.rejectedWith(EVMRevert);
    });

    it('should reject payments that exceed hardcap', async function () {
      await this.crowdsale.setHardCap(hardcap, { from: owner });
      await increaseTimeTo(this.startTime);
      await this.crowdsale.send(hardcap.plus(1)).should.be.rejectedWith(EVMRevert);
    });

  });

  describe('high-level purchase', function () {
    beforeEach(async function () {
      await increaseTimeTo(this.startTime);
    });

    it('should log purchase', async function () {
      const { logs } = await this.crowdsale.sendTransaction({ value: value, from: investor });

      const event = logs.find(e => e.event === 'TokenPurchase');

      should.exist(event);
      event.args.purchaser.should.equal(investor);
      event.args.beneficiary.should.equal(investor);
      event.args.weiAmount.should.be.bignumber.equal(value);
      event.args.tokens.should.be.bignumber.equal(expectedTokenAmount);
    });

    it('should increase totalSupply', async function () {
      await this.crowdsale.send(value);
      const totalSupply = await this.token.totalSupply();
      totalSupply.should.be.bignumber.equal(expectedTokenAmount);
    });

    it('should assign tokens to sender', async function () {
      await this.crowdsale.sendTransaction({ value: value, from: investor });
      let balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(expectedTokenAmount);
    });
    /*  // this is when not using refundVault
    it('should forward funds to wallet', async function () {
      const pre = web3.eth.getBalance(wallet);
      await this.crowdsale.sendTransaction({ value, from: investor });
      const post = web3.eth.getBalance(wallet);
      post.minus(pre).should.be.bignumber.equal(value);
    });*/
    // this is when using refundVault
    it('should forward funds to wallet after end if softcap was reached', async function () {
      await this.crowdsale.setSoftCap(value, { from: owner });
      const softcap = await this.crowdsale.softcap();
      await this.crowdsale.sendTransaction({ value: softcap, from: investor });
      await increaseTimeTo(this.afterEndTime);

      const pre = web3.eth.getBalance(wallet);
      await this.crowdsale.finalize({ from: owner });
      const post = web3.eth.getBalance(wallet);

      post.minus(pre).should.be.bignumber.equal(softcap);
    });
  });

  describe('low-level purchase', function () {
    beforeEach(async function () {
      await increaseTimeTo(this.startTime);
    });

    it('should log purchase', async function () {
      const { logs } = await this.crowdsale.buyTokens(investor, { value: value, from: purchaser });

      const event = logs.find(e => e.event === 'TokenPurchase');

      should.exist(event);
      event.args.purchaser.should.equal(purchaser);
      event.args.beneficiary.should.equal(investor);
      event.args.weiAmount.should.be.bignumber.equal(value);
      event.args.tokens.should.be.bignumber.equal(expectedTokenAmount);
    });

    it('should increase totalSupply', async function () {
      await this.crowdsale.buyTokens(investor, { value, from: purchaser });
      const totalSupply = await this.token.totalSupply();
      totalSupply.should.be.bignumber.equal(expectedTokenAmount);
    });

    it('should assign tokens to beneficiary', async function () {
      await this.crowdsale.buyTokens(investor, { value, from: purchaser });
      const balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(expectedTokenAmount);
    });

    /*  // this is when not using refundVault
    it('should forward funds to wallet', async function () {
      const pre = web3.eth.getBalance(wallet);
      await this.crowdsale.buyTokens(investor, { value, from: purchaser });
      const post = web3.eth.getBalance(wallet);
      post.minus(pre).should.be.bignumber.equal(value);
    });
    */
    it('should forward funds to wallet after end if softcap was reached', async function () {
      await this.crowdsale.setSoftCap(value, { from: owner });
      const softcap = await this.crowdsale.softcap();
      await this.crowdsale.buyTokens(investor, { value: softcap, from: investor });
      await increaseTimeTo(this.afterEndTime);

      const pre = web3.eth.getBalance(wallet);
      await this.crowdsale.finalize({ from: owner });
      const post = web3.eth.getBalance(wallet);

      post.minus(pre).should.be.bignumber.equal(softcap);
    });
  });

  describe('ending', function () {  // as per CappedCrowdsale
    beforeEach(async function () {
      await increaseTimeTo(this.startTime);
      await this.crowdsale.setHardCap(hardcap, { from: owner });
    });

    it('should not be ended if under hardcap', async function () {
      let hasEnded = await this.crowdsale.hasSaleEnded();
      hasEnded.should.equal(false);
      await this.crowdsale.send(lessThanCap);
      hasEnded = await this.crowdsale.hasSaleEnded();
      hasEnded.should.equal(false);
    });

    it('should not be ended if just under hardcap', async function () {
      await this.crowdsale.send(hardcap.minus(1));
      let hasEnded = await this.crowdsale.hasSaleEnded();
      hasEnded.should.equal(false);
    });

    it('should be ended if hardcap reached', async function () {
      await this.crowdsale.send(hardcap);
      let hasEnded = await this.crowdsale.hasSaleEnded();
      hasEnded.should.equal(true);
    });
  });

  describe('finalization', function () {  // as per FinalizableCrowdsale
    it('cannot be finalized before ending', async function () {
      await this.crowdsale.finalize({ from: owner }).should.be.rejectedWith(EVMRevert);
    });

    it('can be finalized by owner after ending', async function () {
      await increaseTimeTo(this.afterEndTime);
      await this.crowdsale.finalize({ from: owner }).should.be.fulfilled;
    });

    it('cannot be finalized by third party after ending', async function () {
      await increaseTimeTo(this.afterEndTime);
      await this.crowdsale.finalize({ from: thirdparty }).should.be.rejectedWith(EVMRevert);
    });

    it('cannot be finalized twice', async function () {
      await increaseTimeTo(this.afterEndTime);
      await this.crowdsale.finalize({ from: owner });
      await this.crowdsale.finalize({ from: owner }).should.be.rejectedWith(EVMRevert);
    });

    it('logs finalized', async function () {
      await increaseTimeTo(this.afterEndTime);
      const { logs } = await this.crowdsale.finalize({ from: owner });
      const event = logs.find(e => e.event === 'Finalized');
      should.exist(event);
    });
  });

  describe('refunds', function () {  // as per RefundableCrowdsale
    it('should deny refunds before end', async function () {
      await this.crowdsale.claimRefund({ from: investor }).should.be.rejectedWith(EVMRevert);
      await increaseTimeTo(this.startTime);
      await this.crowdsale.claimRefund({ from: investor }).should.be.rejectedWith(EVMRevert);
    });

    it('should deny refunds after end if softcap was reached', async function () {
      await this.crowdsale.setSoftCap(value, { from: owner });
      const softcap = await this.crowdsale.softcap();

      await increaseTimeTo(this.startTime);
      await this.crowdsale.sendTransaction({ value: softcap, from: investor });
      await increaseTimeTo(this.afterEndTime);
      await this.crowdsale.claimRefund({ from: investor }).should.be.rejectedWith(EVMRevert);
    });

    it('should allow refunds after end if softcap was not reached', async function () {
      const lessThanGoal = value;
      await this.crowdsale.setSoftCap(value + ether(0.1), { from: owner });
      const softcap = await this.crowdsale.softcap();

      await increaseTimeTo(this.startTime);
      await this.crowdsale.sendTransaction({ value: lessThanGoal, from: investor });
      await increaseTimeTo(this.afterEndTime);

      await this.crowdsale.finalize({ from: owner });

      const pre = web3.eth.getBalance(investor);
      await this.crowdsale.claimRefund({ from: investor, gasPrice: 0 })
        .should.be.fulfilled;
      const post = web3.eth.getBalance(investor);

      post.minus(pre).should.be.bignumber.equal(lessThanGoal);
    });

  });

  it('should forward funds to wallet after end if softcap was reached', async function () {

    await this.crowdsale.setSoftCap(value, { from: owner });
    const softcap = await this.crowdsale.softcap();
    await increaseTimeTo(this.startTime);
    await this.crowdsale.sendTransaction({ value: softcap, from: investor });

    await increaseTimeTo(this.afterEndTime);

    const pre = web3.eth.getBalance(wallet);
    await this.crowdsale.finalize({ from: owner });
    const post = web3.eth.getBalance(wallet);

    post.minus(pre).should.be.bignumber.equal(softcap);
  });

});
