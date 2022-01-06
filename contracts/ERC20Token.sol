pragma solidity ^0.5.12;
// import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/IERC20.sol";

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract ERC20Token is IERC20 {
    
    string public name;
    string public tickerSymbol;
    uint public tokenTotalSupply;
    uint8 public decimals;
    mapping(address => uint) public balances;
    mapping(address => mapping(address => uint)) public allowed;

    constructor(
        string memory _name,
        string memory _tickerSymbol,
        uint _tokenTotalSupply,
        uint8 _decimals
    ) public {
        name = _name;
        tickerSymbol = _tickerSymbol;
        tokenTotalSupply = _tokenTotalSupply;
        decimals = _decimals;
        balances[msg.sender] = _tokenTotalSupply;
    }

    function totalSupply() public view returns(uint) {
        return tokenTotalSupply;
    }

    function balanceOf(address account) public view returns(uint) {
        return balances[account];
    }

    function transfer(address recipient, uint amount) 
        public hasSufficientBalance(msg.sender, amount) returns(bool) {
        balances[msg.sender] -= amount;
        balances[recipient] += amount;
        emit Transfer(msg.sender, recipient, amount);
        return true;
    }

    function approve(address spender, uint amount) 
        public hasSufficientBalance(msg.sender, amount) returns (bool) {
        allowed[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function allowance(address owner, address spender) public view returns(uint) {
        return allowed[owner][spender];
    }

    function transferFrom(address spender, address recipient, uint amount) 
        public hasSufficientBalance(spender, amount) returns(bool) {
            require(allowed[spender][msg.sender] >= amount, "insufficient allowed balance");
            allowed[spender][msg.sender] -= amount;
            balances[spender] -= amount;
            balances[recipient] += amount;
            emit Transfer(spender, recipient, amount);
            return true;
    }

    modifier hasSufficientBalance(address account, uint amount) {
        require(balances[account] >= amount, "account has insufficient balance");
        _;
    }


}