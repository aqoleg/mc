/*
https://gitcoin.co/issue/MPlus4Climate/MPlusToolKit/1/100023834
https://github.com/aqoleg
*/


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


/// @title M+Climate
/// @author aqoleg
contract Mc {
    using Math for uint256;

    /// @notice this address can retire carbon credits, clean spam tokens and change fund percent
    /// @return address of the carbon credit authority
    address public operator;

    /// @notice this address receives part of the issued tokens
    /// @return address of the global M+ community development fund
    address public fund;

    /// @notice fund percent
    /// @return part of the issued tokens which will be transferred to the fund, in the base points (0.01%)
    uint16 public fundBasePoints;

    /// @return total number of all retired carbon credits
    uint256 public totalCredits;

    /// @return address that retired the carbon credit with this serial number
    mapping(uint256 => address) public serialNumbers;

    /// @return number of all retired carbon credits for each account
    mapping(address => uint256) public credits;

    /// @notice these credits can be converted to tokens with claim() function
    /// @return number of the retired but unclaimed carbon credits for each account
    mapping(address => uint256) public unclaimedCredits;

    /// @dev erc20
    /// @return total amount of tokens
    uint256 public totalSupply;

    /// @dev erc20
    /// @return number of tokens for each account
    mapping(address => uint256) public balanceOf;

    /// @notice [holder][spender]
    /// @dev erc20
    /// @return number of tokens allowed for transfer using transferFrom() function
    mapping(address => mapping(address => uint256)) public allowance;

    /// @dev erc20
    /// @return number of decimals in the token
    uint8 public constant decimals = 18;

    /// @dev erc20
    /// @return name of the token
    string public name = "M+Climate test token";

    /// @dev erc20
    /// @return symbol of the token
    string public symbol = "M+C";

    /// @notice emits when the address of the operator is set
    event Operator(address _operator);

    /// @notice emits when the address of the fund is set
    event Fund(address _fund);

    /// @notice emits when the fund percent is set
    /// @param _fundBasePoints fund percent in base points (0.01%)
    event FundBasePoints(uint16 _fundBasePoints);

    /// @notice emits when new carbon credits are retired and no tokens are issued
    event Retire(address indexed _holder, uint256 _credits);

    /// @notice emits when new carbon credits are retired and tokens are issued and sent
    event RetireAndSend(address indexed _holder, uint256 _credits);

    /// @notice emits when tokens for retired and unclaimed carbon credits are requested
    event Claim(address indexed _holder, address _to, uint256 _credits);

    /// @notice emits when tokens are transferred
    /// @dev erc20
    event Transfer(address indexed _from, address indexed _to, uint256 _value);

    /// @notice emits when allowance for transferFrom() function is changed
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

    /// @notice allows the operator to get tokens or eth that have been sent to this contract
    /// @param _contract erc20 contract or zero address for eth
    function clean(address _contract, uint256 _value) public onlyOperator {
        if (_contract == address(0)) {
            msg.sender.transfer(_value);
        } else {
            Erc20(_contract).transfer(msg.sender, _value);
        }
    }

    /// @notice allows the operator to change its address
    function changeOperator(address _operator) public notZero(_operator) onlyOperator {
        operator = _operator;
        emit Operator(operator);
    }

    /// @notice allows the fund to change its address
    function changeFund(address _fund) public notZero(_fund) {
        require(msg.sender == fund, "not a fund");
        fund = _fund;
        emit Fund(fund);
    }

    /// @notice allows the operator to change the fund percent
    /// @param _fundBasePoints value from 0 (0%) to 10000 (100%)
    function changeFundBasePoint(uint16 _fundBasePoints) public onlyOperator {
        require(_fundBasePoints <= 10000, "too big value");
        fundBasePoints = _fundBasePoints;
        emit FundBasePoints(fundBasePoints);
    }

    /// @notice allows the operator to retire carbon credits without issuing new tokens
    /// @param _holder non-zero address that can claim tokens for these retired carbon credits
    /// @param _serialNumbers serial numbers of retired carbon credits
    /// @return _credits number of carbon credits actually retired (without duplicates)
    function retire(address _holder, uint256[] calldata _serialNumbers)
        public
        notZero(_holder)
        onlyOperator
        returns (uint256 _credits)
    {
        _credits = _checkSerialNumbers(_holder, _serialNumbers);
        totalCredits = totalCredits.add(_credits);
        credits[_holder] = credits[_holder].add(_credits);
        unclaimedCredits[_holder] = unclaimedCredits[_holder].add(_credits);
        emit Retire(_holder, _credits);
    }

    /// @notice allows the operator to retire carbon credits, issue new tokens and send them
    /// @param _holder non-zero address that receives tokens
    /// @param _serialNumbers serial numbers of retired carbon credits
    /// @return _credits number of carbon credits actually retired (without duplicates)
    function retireAndSend(address _holder, uint256[] calldata _serialNumbers)
        public
        notZero(_holder)
        onlyOperator
        returns (uint256 _credits)
    {
        _credits = _checkSerialNumbers(_holder, _serialNumbers);
        totalCredits = totalCredits.add(_credits);
        credits[_holder] = credits[_holder].add(_credits);
        emit RetireAndSend(_holder, _credits);
        _mint(_holder, _credits);
    }

    /// @notice issues tokens for sender's unclaimed carbon credits
    /// @param _to non-zero address that recieves tokens
    /// @return _credits number of carbon credits for which tokens were created
    function claim(address _to) public notZero(_to) returns (uint256 _credits) {
        address holder = msg.sender;
        _credits = unclaimedCredits[holder];
        unclaimedCredits[holder] = 0;
        emit Claim(holder, _to, _credits);
        _mint(_to, _credits);
    }

    /// @notice transfers tokens
    /// @dev erc20
    function transfer(address _to, uint256 _value) public returns (bool) {
        return _transfer(msg.sender, _to, _value);
    }

    /// @notice transfers tokens not owned by the sender
    /// @dev erc20
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
        allowance[_from][msg.sender] = allowance[_from][msg.sender].sub(_value);
        return _transfer(_from, _to, _value);
    }

    /// @notice allows another address to transfer your tokens
    /// @dev erc20
    function approve(address _spender, uint256 _value) public notZero(_spender) returns (bool) {
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    // avoids using the same credit twice, returns the number of unique serial numbers
    function _checkSerialNumbers(address _holder, uint256[] calldata _serialNumbers)
        private
        returns (uint256 _credits)
    {
        _credits = _serialNumbers.length;
        for (uint256 i = 0; i < _serialNumbers.length; i++) {
            if (serialNumbers[_serialNumbers[i]] != address(0)) {
                _credits = _credits.sub(1);
            } else {
                serialNumbers[_serialNumbers[i]] = _holder;
            }
        }
    }

    // creates and sends new tokens
    function _mint(address _to, uint256 _credits) private {
        uint256 createdTokens = _credits.mul(10**20); // 100 tokens per credit
        totalSupply = totalSupply.add(createdTokens);

        uint256 tokens = createdTokens.mul(fundBasePoints).div(10000);
        balanceOf[fund] = balanceOf[fund].add(tokens);
        emit Transfer(address(0), fund, tokens);

        tokens = createdTokens.sub(tokens);
        balanceOf[_to] = balanceOf[_to].add(tokens);
        emit Transfer(address(0), _to, tokens);
    }

    // transfers tokens
    function _transfer(address _from, address _to, uint256 _value)
        private
        notZero(_to)
        returns (bool)
    {
        balanceOf[_from] = balanceOf[_from].sub(_value);
        balanceOf[_to] = balanceOf[_to].add(_value);
        emit Transfer(_from, _to, _value);
        return true;
    }
}