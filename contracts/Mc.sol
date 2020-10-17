// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.3;


interface Erc20 {
    function transfer(address _to, uint256 _value) external;
}


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


/// @title https://gitcoin.co/issue/MPlus4Climate/MPlusToolKit/1/100023834
/// @author aqoleg
contract Mc {
    using Math for uint256;

    // carbon credit authority; this address can retire carbon credits and change fundBasePoints
    address public operator;
    // global M+ community development fund, this address receives part of the issued tokens
    address public fund;
    // part of the issued tokens that will be transferred to the fund; in the base points (0.01%)
    uint16 public fundBasePoints;

    // serial numbers of all retired carbon credits
    mapping(uint256 => bool) public serialNumbers;
    // total number of all retired carbon credits
    uint256 public totalCredits;
    // number of all retired carbon credits for each account
    mapping(address => uint256) public credits;
    // number of the retired but unclaimed carbon credits for each account
    mapping(address => uint256) public unclaimedCredits;

    // erc20
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance; // tokens = allowance[holder][spender]
    uint8 public constant decimals = 18;
    string public name = "M+Climate test token";
    string public symbol = "M+C";

    event Operator(address _operator);

    event Fund(address _fund);

    event FundBasePoints(uint16 _fundBasePoints);

    event Retire(address indexed _holder, uint256 _value);

    event RetireAndSend(address indexed _holder, uint256 _value);

    event Claim(address indexed _holder, address _to, uint256 _value);

    /// @dev erc20
    event Transfer(address indexed _from, address indexed _to, uint256 _value);

    /// @dev erc20
    event Approval(address indexed _holder, address indexed _spender, uint256 _value);

    modifier notZero(address _address) {
        require(_address != address(0), "zero address");
        _;
    }

    modifier onlyOperator {
        require(msg.sender == operator, "not an operator");
        _;
    }

    constructor(address _fund, uint16 _fundBasePoints) {
        operator = msg.sender;
        fund = _fund;
        fundBasePoints = _fundBasePoints;
        emit Operator(operator);
        emit Fund(fund);
        emit FundBasePoints(fundBasePoints);
    }

    /// @notice transfer spam tokens or eth to the operator
    /// @param _contract zero address to get eth, else erc20 address
    function clean(address _contract, uint256 _value) public onlyOperator {
        if (_contract == address(0)) {
            msg.sender.transfer(_value);
        } else {
            Erc20(_contract).transfer(msg.sender, _value);
        }
    }

    function changeOperator(address _operator) public notZero(_operator) onlyOperator {
        operator = _operator;
        emit Operator(operator);
    }

    function changeFund(address _fund) public notZero(_fund) {
        require(msg.sender == fund, "not a fund");
        fund = _fund;
        emit Fund(fund);
    }

    function changeFundBasePoint(uint16 _fundBasePoints) public onlyOperator {
        fundBasePoints = _fundBasePoints;
        emit FundBasePoints(fundBasePoints);
    }

    function retire(address _holder, uint256[] calldata _serialNumbers)
        public
        notZero(_holder)
        onlyOperator
        returns (uint256 _value)
    {
        _value = _checkSerialNumbers(_serialNumbers);
        if (_value != 0) {
            totalCredits = totalCredits.add(_value);
            credits[_holder] = credits[_holder].add(_value);
            unclaimedCredits[_holder] = unclaimedCredits[_holder].add(_value);
            emit Retire(_holder, _value);
        }
    }

    function retireAndSend(address _holder, uint256[] calldata _serialNumbers)
        public
        notZero(_holder)
        onlyOperator
        returns (uint256 _value)
    {
        _value = _checkSerialNumbers(_serialNumbers);
        if (_value != 0) {
            totalCredits = totalCredits.add(_value);
            credits[_holder] = credits[_holder].add(_value);
            emit RetireAndSend(_holder, _value);
            _mint(_holder, _value);
        }
    }

    function claim(address _to) public notZero(_to) returns (uint256 _value) {
        address holder = msg.sender;
        _value = unclaimedCredits[holder];
        if (_value != 0) {
            unclaimedCredits[holder] = 0;
            emit Claim(holder, _to, _value);
            _mint(_to, _value);
        }
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
    function approve(address _spender, uint256 _value) public notZero(_spender) returns (bool) {
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function _checkSerialNumbers(uint256[] calldata _serialNumbers) private returns (uint256 _value) {
        _value = _serialNumbers.length;
        for (uint256 i = 0; i < _serialNumbers.length; i++) {
            if (serialNumbers[_serialNumbers[i]]) {
                _value = _value.sub(1);
            } else {
                serialNumbers[_serialNumbers[i]] = true;
            }
        }
    }

    function _mint(address _to, uint256 _value) private {
        _value = _value.mul(10**20); // 100 tokens per credit
        totalSupply = totalSupply.add(_value);

        uint256 tokens = _value.mul(fundBasePoints).div(10000);
        balanceOf[fund] = balanceOf[fund].add(tokens);
        emit Transfer(address(0), fund, tokens);

        tokens = _value.sub(tokens);
        balanceOf[_to] = balanceOf[_to].add(tokens);
        emit Transfer(address(0), _to, tokens);
    }

    function _transfer(address _from, address _to, uint256 _value) private notZero(_to) returns (bool) {
        balanceOf[_from] = balanceOf[_from].sub(_value);
        balanceOf[_to] = balanceOf[_to].add(_value);
        emit Transfer(_from, _to, _value);
        return true;
    }
}
