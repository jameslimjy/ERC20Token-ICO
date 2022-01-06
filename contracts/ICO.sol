pragma solidity ^0.5.12;
import "./ERC20Token.sol";

contract ICO {
    struct Sale {
        address payable investor;
        uint quantity;
    }

    uint constant MINDURATION = 100;
    address public token;
    address public admin;
    uint public end;
    uint public price;
    uint public availTokens;
    uint public minPurchase;
    uint public maxPurchase;
    bool public tokensReleased;
    mapping(address => bool) public whitelist;
    Sale[] public sales;
    
    constructor(
        string memory _name, 
        string memory _tickerSymbol, 
        uint _tokenTotalSupply, 
        uint8 _decimals
        ) public {
            token = address(new ERC20Token(_name, _tickerSymbol, _tokenTotalSupply, _decimals));
            admin = msg.sender;
        }

    function start(uint duration, uint _price, uint _availTokens, uint _minPurchase, uint _maxPurchase) external onlyAdmin() {
        require(end == 0, "ICO has already started");
        uint totalSupply = ERC20Token(token).totalSupply();
        require(_availTokens <= totalSupply, "available tokens must be less than total supply of ERC20 token");
        require(duration >= MINDURATION, "duration of ICO must last for at least 1 day");
        require(_maxPurchase > 0 && _maxPurchase <= totalSupply, "max purchase must be less than total supply of ERC20 token");
        require(_minPurchase > 0 && _minPurchase < _maxPurchase, "min purchase must be less than max purchase");
        end = now + duration;
        price = _price;
        availTokens = _availTokens;
        minPurchase = _minPurchase;
        maxPurchase = _maxPurchase;
    }

    function addToWhitelist(address payable investor) external onlyAdmin() ICOActive() tokensNotReleased() {
        whitelist[investor] = true;
    }

    function buy() payable external onlyWhitelisted() ICOActive() tokensNotReleased() {
        require(msg.value % price == 0, "value sent must be a multiple of the price");
        uint quantity = msg.value / price;
        require(quantity >= minPurchase && quantity <= maxPurchase, "quantity must be between minPurchase and maxPurchase");
        require(quantity <= availTokens, "insufficient available tokens to be purchased");
        sales.push(Sale(msg.sender, quantity));
        availTokens -= quantity;
    }

    function release() external onlyAdmin() tokensNotReleased() {
        require(now > end, "ICO has not ended yet");
        require(tokensReleased == false, "tokens have already been released");
        ERC20Token tokenContract = ERC20Token(token);
        for(uint i = 0; i < sales.length; i++) {
            Sale storage sale = sales[i];
            tokenContract.transfer(sale.investor, sale.quantity);
        }
        tokensReleased = true;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "only admin can access this function");
        _;
    }

    modifier onlyWhitelisted() {
        require(whitelist[msg.sender] == true, "only whitelisted investors can access this function");
        _;
    }

    modifier ICOActive() {
        require(now < end, "ICO is no longer active");
        _;
    }

    modifier tokensNotReleased() {
        require(tokensReleased == false, "tokens have already been released");
        _;
    }
}