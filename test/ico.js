const { expectRevert, time } = require('@openzeppelin/test-helpers');
const ICO = artifacts.require('ICO.sol');
const Token = artifacts.require('ERC20Token.sol');

contract('ICO', accounts => {
  let token;
  let ico;
  const name = 'Sour Evas';
  const tickerSymbol = 'SVA';
  const tokenTotalSupply = 1000000;
  const decimals = 18;
  const [admin, investor1, investor2] = [accounts[0], accounts[1], accounts[2]];

  beforeEach(async () => {
    ico = await ICO.new(name, tickerSymbol, tokenTotalSupply, decimals);
    const tokenAddrress = await ico.token();
    token = await Token.at(tokenAddrress);
  });

  it("should create a token", async() => {
    const _name = await token.name()
    const _tickerSymbol = await token.tickerSymbol();
    const _tokenTotalSupply = await token.tokenTotalSupply();
    const _decimals = await token.decimals();
    assert(name === _name);
    assert(tickerSymbol === _tickerSymbol);
    assert(tokenTotalSupply === _tokenTotalSupply.toNumber());
    assert(decimals === _decimals.toNumber());
  })

  it("should start the ICO", async() => {
    const duration = 1000;
    const price = 5;
    const availTokens = 1000;
    const minPurchase = 10;
    const maxPurchase = 100;
    const start = parseInt((new Date()).getTime() / 1000);
    time.increaseTo(start);
    await ico.start(duration, price, availTokens, minPurchase, maxPurchase, {from: admin});
    
    const end = start + duration;
    const _end = await ico.end();
    const _price = await ico.price();
    const _availTokens = await ico.availTokens();
    const _minPurchase = await ico.minPurchase();
    const _maxPurchase = await ico.maxPurchase();

    assert(_end.eq(web3.utils.toBN(end)));
    assert(_price.eq(web3.utils.toBN(price)));
    assert(_availTokens.eq(web3.utils.toBN(availTokens)));
    assert(_minPurchase.eq(web3.utils.toBN(minPurchase)));
    assert(_maxPurchase.eq(web3.utils.toBN(maxPurchase)));
  })

  context('Sale started', () => {
    const duration = 1000;
    const price = 5;
    const availTokens = 1000;
    const minPurchase = 10;
    const maxPurchase = 100;
    const valueSent = 250;
    const quantityBought = valueSent/price;
    beforeEach(async() => {
      await ico.start(duration, price, availTokens, minPurchase, maxPurchase, {from: admin});
      await ico.addToWhitelist(investor1, {from: admin});
    })

    it("should add an address to the whitelist", async() => {
      const whitelisted = await ico.whitelist(investor1);
      assert(whitelisted === true);
    })

    it("should allow a whitelisted address to buy tokens", async() => {
      await ico.buy({from: investor1, value: valueSent});
      const _availTokens = await ico.availTokens();
      assert(_availTokens.toNumber() === (availTokens - quantityBought));
      const firstSale = await ico.sales(0);
      assert(firstSale.investor === investor1);
      assert(firstSale.quantity.toNumber() === quantityBought);
    })

    it("should release the tokens", async() => {
      await ico.buy({from: investor1, value: valueSent});
      const firstSale = await ico.sales(0);
      const tokenAmount = firstSale.quantity;
      await time.increase(duration + 10);
      await ico.release({from: admin});
      const _tokenAmount = await token.balanceOf(investor1);
      assert(tokenAmount.eq(_tokenAmount));
    })

    it("should not allow non whitelisted address to buy tokens", async() => {
      await expectRevert(
        ico.buy({from: investor2, value: valueSent}),
        "only whitelisted investors can access this function"
      )
    })

    it("should not allow purchase of tokens after ICO ends", async() => {
      await time.increase(duration + 10);
      await ico.release({from: admin});
      await expectRevert(
        ico.buy({from: investor1, value: valueSent}),
        "ICO is no longer active"
      )
    })
  });
});
