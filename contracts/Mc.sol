// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.3;


library Math {
    /// @return uint256 = a + b
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        assert(c >= a);
        return c;
    }

    /// @return uint256 = a - b
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b <= a, "too big value");
        return a - b;
    }

    /// @return uint256 = a * b
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a == 0) {
            return 0;
        }
        uint256 c = a * b;
        assert(c / a == b);
        return c;
    }

    /// @return uint256 = a / b
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        return a / b;
    }
}


contract Mc {
    using Math for uint256;

    address public owner;

    address public fund;
    
    // this address is used as a retired account for carbon credits
    mapping(uint256 => address) public carbonCredits; // holder = carbonCredits[serialNumber]

    uint256 public totalSupply; // tokens, erc20
    mapping(address => uint256) public balanceOf; // tokens, erc20
    mapping(address => mapping(address => uint256)) public allowance; // tokens = allowance[holder][spender], erc20
    uint8 public constant decimals = 18; // erc20
    string public name = "M+C test token"; // erc20
    string public symbol = "M+"; // erc20

    event IssueCarbonCredits(address indexed _holder, uint256 _credits);

    event RetireCarbonCredits(address indexed _holder, uint256 _credits);

    /// @dev erc20
    event Transfer(address indexed _from, address indexed _to, uint256 _value);

    /// @dev erc20
    event Approval(address indexed _holder, address indexed _spender, uint256 _value);

    modifier onlyOwner {
        require(msg.sender == owner, "unauthorized");
        _;
    }

    constructor(address _fund) {
        owner = msg.sender;
        fund = _fund;
    }

    function setOwner(address _owner) public onlyOwner {
        require(_owner != address(0), "zero address");
        owner = _owner;
    }

    function setFund(address _fund) public onlyOwner {
        require(_fund != address(0), "zero address");
        fund = _fund;
    }

    function issueCarbonCredits(address _holder, uint256[] calldata _serials) public onlyOwner {
        require(_holder != address(0), "zero address");
        uint256 credits = 0;
        for (uint256 i = 0; i < _serials.length; i++) {
            if (carbonCredits[_serials[i]] == address(0)) {
                carbonCredits[_serials[i]] = _holder;
                credits = credits.add(1);
            }
        }
        if (credits > 0) {
            emit IssueCarbonCredits(_holder, credits);
        }
    }

    function retireCarbonCredits(address _holder, uint256[] calldata _serials) public onlyOwner {
        uint256 credits = 0;
        for (uint256 i = 0; i < _serials.length; i++) {
            if (carbonCredits[_serials[i]] == _holder) {
                carbonCredits[_serials[i]] = address(this);
                credits = credits.add(1);
            }
        }
        if (credits == 0) {
            return;
        }
        emit RetireCarbonCredits(_holder, credits);
        // 100 tokens per credit
        uint256 tokens = credits.mul(10**20);
        totalSupply = totalSupply.add(tokens);
        // 90% to the holder
        tokens = credits.mul(9 * 10**19);
        balanceOf[_holder] = balanceOf[_holder].add(tokens);
        emit Transfer(address(0), _holder, tokens);
        // 10% to the fund
        tokens = credits.mul(10**19);
        balanceOf[fund] = balanceOf[fund].add(tokens);
        emit Transfer(address(0), fund, tokens);
    }

    /// @dev erc20
    function transfer(address _to, uint256 _value) public returns (bool) {
        return _transfer(msg.sender, _to, _value);
    }

    /// @dev erc20
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
        allowance[_from][msg.sender] = allowance[_from][msg.sender].sub(_value);
        return _transfer(_from, _to, _value);
    }

    /// @notice approves other address to spend your tokens
    /// @dev erc20
    function approve(address _spender, uint256 _value) public returns (bool) {
        require(_spender != address(0), "zero address");
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }
    
    function _transfer(address _from, address _to, uint256 _value) private returns (bool) {
        require(_to != address(0), "zero _to");
        balanceOf[_from] = balanceOf[_from].sub(_value);
        balanceOf[_to] = balanceOf[_to].add(_value);
        emit Transfer(_from, _to, _value);
        return true;
    }
}
