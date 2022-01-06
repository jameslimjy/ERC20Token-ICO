const { expectRevert } = require('@openzeppelin/test-helpers');
const ERC20Token = artifacts.require('ERC20Token.sol');

contract('ERC20Token', accounts => {
  let token;
  const initialBalance = 1000000;
  const [acc1, acc2, acc3] = [accounts[0], accounts[1], accounts[2]];

  beforeEach(async () => {
    token = await ERC20Token.new('Sour Evas', 'SVA', initialBalance, 18); 
  });

  it("should return total supply", async() => {
    const totalSupply = await token.totalSupply();
    assert(totalSupply.eq(web3.utils.toBN(initialBalance)));
  })

  it("should return balance of an address", async() => {
    const initialAccBal1 = await token.balances(acc1);
    assert(initialAccBal1.eq(web3.utils.toBN(initialBalance)));
  })

  it("should transfer between two addresses", async() => {
    const initialAccBal1 = await token.balances(acc1);
    const initialAccBal2 = await token.balances(acc2);
    const transferAmount = 1000;
    await token.transfer(acc2, transferAmount, {from: acc1})
    const afterAccBal2 = await token.balances(acc2);
    const afterAccBal1 = await token.balances(acc1);
    assert(afterAccBal2.sub(initialAccBal2).toNumber() === transferAmount);
    assert(initialAccBal1.sub(afterAccBal1).toNumber() === transferAmount);
  })

  it("should approve another address to send a certain amount belonging to a particular address", async() => {
    const approveAmount = 1000;
    await token.approve(acc3, approveAmount, {from: acc1});
    const allowedAmount = await token.allowed(acc1, acc3);
    assert(allowedAmount.toNumber() === approveAmount);
  })

  it("should transfer from an address to another address with an approved address", async() => {
    const transferAmount = 500;
    const approveAmount = 1000;
    await token.approve(acc3, approveAmount, {from: acc1});
    const initialAllowedAmount = await token.allowed(acc1, acc3);
    const initialAccBal2 = await token.balances(acc2);
    await token.transferFrom(acc1, acc2, transferAmount, {from: acc3});
    const afterAccBal2 = await token.balances(acc2);
    const afterAllowedAmount = await token.allowed(acc1, acc3);
    assert(afterAccBal2.sub(initialAccBal2).toNumber() === transferAmount);
    assert(initialAllowedAmount.sub(afterAllowedAmount).toNumber() === transferAmount);
  })

  it("should not transfer if token balance too low", async() => {
    const transferAmount = 10;
    await expectRevert(
      token.transfer(acc3, transferAmount, {from: acc2}),
      "account has insufficient balance"
    )
  })

  it("should not transfer if approved amount too low", async() => {
    const transferAmount = 500;
    const approveAmount = 200;
    token.approve(acc3, approveAmount, {from: acc1});
    await expectRevert(
      token.transferFrom(acc1, acc2, transferAmount, {from: acc3}),
      "insufficient allowed balance"
    )
  })

});
