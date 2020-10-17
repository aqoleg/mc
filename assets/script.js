"use strict";

(function () {
    var contractAddress = '0xe0660bF997A5a2f18561Bd6a60412195359Be943';
    var abi = [
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "name": "balanceOf",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "_to",
                    "type": "address"
                }
            ],
            "name": "claim",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "_value",
                    "type": "uint256"
                }
            ],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "name": "credits",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "_holder",
                    "type": "address"
                },
                {
                    "internalType": "uint256[]",
                    "name": "_serialNumbers",
                    "type": "uint256[]"
                }
            ],
            "name": "retire",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "_value",
                    "type": "uint256"
                }
            ],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "_holder",
                    "type": "address"
                },
                {
                    "internalType": "uint256[]",
                    "name": "_serialNumbers",
                    "type": "uint256[]"
                }
            ],
            "name": "retireAndSend",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "_value",
                    "type": "uint256"
                }
            ],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "operator",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "name": "unclaimedCredits",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "_holder",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "_value",
                    "type": "uint256"
                }
            ],
            "name": "Retire",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "_holder",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "_value",
                    "type": "uint256"
                }
            ],
            "name": "RetireAndSend",
            "type": "event"
        }
    ];

    var contract = null; // null if network is not ropsten
    var account = null; // checksum address or null
    var operator; // checksum address

    window.onload = function () {
        document.getElementById('contract').href = 'https://ropsten.etherscan.io/address/' +
            contractAddress;

        document.getElementById('connect').onclick = connect;
        document.getElementById('claim').onclick = claim;
        document.getElementById('retire').onclick = retire;

        var script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/web3@latest/dist/web3.min.js';
        script.onload = function () {
            document.getElementById('loading').style.display = 'none';
            if (typeof window.ethereum === 'undefined') {
                document.getElementById('install').style.display = 'block';
            } else {
                window.web3 = new Web3(ethereum);
                load();
                ethereum.on('chainChanged', load);
                ethereum.on('accountsChanged', load);
                ethereum.autoRefreshOnNetworkChange = false;
            }
        };
        document.body.appendChild(script);
    };

    function load() {
        ethereum.request({
            method: 'net_version'
        }).then(function (network) {
            if (Number(network) !== 3) {
                contract = null;
                account = null;
                document.getElementById('network').style.display = 'block';
                document.getElementById('connect').style.display = 'none';
                document.getElementById('user').style.display = 'none';
                document.getElementById('operator').style.display = 'none';
            } else if (contract === null) {
                document.getElementById('network').style.display = 'none';
                document.getElementById('loading').style.display = 'block';
                contract = new web3.eth.Contract(abi, contractAddress);
                contract.events.allEvents().on('data', function () {
                    if (account !== null && account !== operator) {
                        loadAccount();
                    }
                });
                contract.methods.operator().call().then(function (result) {
                    operator = web3.utils.toChecksumAddress(result);
                    document.getElementById('loading').style.display = 'none';
                    load1();
                });
            } else {
                load1();
            }
        }).catch(function (error) {
            console.error(error);
            if (error.message) {
                error = error.message;
            }
            alert(error);
        });

        function load1() {
            ethereum.request({
                method: 'eth_accounts'
            }).then(function (accounts) {
                if (accounts.length === 0) {
                    account = null;
                    document.getElementById('connect').style.display = 'block';
                    document.getElementById('user').style.display = 'none';
                    document.getElementById('operator').style.display = 'none';
                } else if (accounts[0] !== account) {
                    account = web3.utils.toChecksumAddress(accounts[0]);
                    document.getElementById('connect').style.display = 'none';
                    if (account === operator) {
                        document.getElementById('user').style.display = 'none';
                        document.getElementById('operator').style.display = 'block';
                    } else {
                        document.getElementById('claimAddress').value = account;
                        document.getElementById('user').style.display = 'block';
                        document.getElementById('operator').style.display = 'none';
                        loadAccount();
                    }
                }
            });
        }
    }

    function loadAccount() {
        contract.methods.balanceOf(account).call().then(function (result) {
            result = new BigNumber(result).shiftedBy(-18);
            if (result.isZero()) {
                document.getElementById('tokens').removeAttribute('title');
                document.getElementById('tokens').innerHTML = '0';
            } else {
                document.getElementById('tokens').title = result.toFixed(18);
                result = result.toFixed(3, BigNumber.ROUND_DOWN);
                document.getElementById('tokens').innerHTML = result;
            }
        });
        contract.methods.credits(account).call().then(function (credits) {
            document.getElementById('retired').innerHTML = credits;
            contract.methods.unclaimedCredits(account).call().then(function (unclaimedCredits) {
                credits = new BigNumber(credits);
                unclaimedCredits = new BigNumber(unclaimedCredits);
                document.getElementById('claimed').innerHTML = credits.minus(unclaimedCredits);
            });
        });
    }

    function connect() {
        ethereum.request({
            method: 'eth_requestAccounts'
        }).catch(function (error) {
            console.error(error);
            if (error.message) {
                error = error.message;
            }
            alert(error);
        });
    }

    function claim() {
        var address = document.getElementById('claimAddress').value;
        if (!web3.utils.isAddress(address)) {
            document.getElementById('claimAddressHint').innerHTML = 'enter valid address';
            return;
        }
        document.getElementById('claimAddressHint').innerHTML = '';

        var message;
        contract.methods.claim(address).send({
            from: account
        }).on('transactionHash', function (hash) {
            message = printLog(document.getElementById('userLog'), hash);
        }).on('confirmation', function (confirmationNumber, receipt) {
            if (confirmationNumber == 0) {
                if (!receipt.status) {
                    message.innerHTML = ', rejected';
                } else {
                    var msg = ', retired ';
                    if (receipt.events.Claim) {
                        msg += receipt.events.Claim.returnValues._value;
                    } else {
                        msg += '0';
                    }
                    message.innerHTML = msg + ' carbon credits';
                }
            }
        }).catch(function (error) {
            console.error(error);
            if (error.message) {
                error = error.message;
            }
            alert(error);
        });
    }

    function retire() {
        var serials = parseSerials(
            document.getElementById('serials').value,
            document.getElementById('serialsHint')
        );
        if (!serials) {
            return;
        }
        var address = document.getElementById('retireAddress').value;
        if (!web3.utils.isAddress(address)) {
            document.getElementById('retireAddressHint').innerHTML = 'enter valid address';
            return;
        }
        document.getElementById('retireAddressHint').innerHTML = '';

        var message;
        if (document.getElementById('retireAndSend').checked) {
            contract.methods.retireAndSend(address, serials).send({
                from: account
            }).on('transactionHash', function (hash) {
                message = printLog(document.getElementById('operatorLog'), hash);
            }).on('confirmation', function (confirmationNumber, receipt) {
                if (confirmationNumber == 0) {
                    if (!receipt.status) {
                        message.innerHTML = ', rejected';
                    } else {
                        var msg = ', retired and sent ';
                        if (receipt.events.RetireAndSend) {
                            msg += receipt.events.RetireAndSend.returnValues._value;
                        } else {
                            msg += '0';
                        }
                        message.innerHTML = msg + ' carbon credits';
                    }
                }
            }).catch(function (error) {
                console.error(error);
                if (error.message) {
                    error = error.message;
                }
                alert(error);
            });
        } else {
            contract.methods.retire(address, serials).send({
                from: account
            }).on('transactionHash', function (hash) {
                message = printLog(document.getElementById('operatorLog'), hash);
            }).on('confirmation', function (confirmationNumber, receipt) {
                if (confirmationNumber == 0) {
                    if (!receipt.status) {
                        message.innerHTML = ', rejected';
                    } else {
                        var msg = ', retired ';
                        if (receipt.events.Retire) {
                            msg += receipt.events.Retire.returnValues._value;
                        } else {
                            msg += '0';
                        }
                        message.innerHTML = msg + ' carbon credits';
                    }
                }
            }).catch(function (error) {
                console.error(error);
                if (error.message) {
                    error = error.message;
                }
                alert(error);
            });
        }
    }

    function parseSerials(text, hint) {
        var serials = [];
        var startIndex = 0;
        for (var i = 0; i < text.length; i++) {
            if (text.charAt(i) < '0') {
                if (startIndex < i) {
                    serials.push(text.substring(startIndex, i));
                }
                startIndex = i + 1;
            }
        }
        if (startIndex < text.length) {
            serials.push(text.substring(startIndex));
        }

        if (serials.length === 0) {
            hint.innerHTML = 'enter serial numbers';
            return false;
        }
        hint.innerHTML = '';
        return serials;
    }

    function printLog(div, hash) {
        var p = document.createElement('p');
        p.classList.add('onestring');
        var a = document.createElement('a');
        a.innerHTML = hash;
        a.href = 'https://ropsten.etherscan.io/tx/' + hash;
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener');
        p.appendChild(a);
        var span = document.createElement('span');
        span.innerHTML = ', waiting for confirmation...';
        p.appendChild(span);
        div.insertBefore(p, div.firstChild);
        return span;
    }
})();