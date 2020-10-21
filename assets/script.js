"use strict";

(function () {
    var contractAddress = '0x8EC307125F5915dAb1e18E2205A055b339d0DcAB';
    var abi = [
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
                    "name": "_credits",
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
                    "name": "_credits",
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
                    "name": "_to",
                    "type": "address"
                }
            ],
            "name": "claim",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "_credits",
                    "type": "uint256"
                }
            ],
            "stateMutability": "nonpayable",
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
                    "name": "_credits",
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
                    "name": "_credits",
                    "type": "uint256"
                }
            ],
            "name": "RetireAndSend",
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
                    "internalType": "address",
                    "name": "_to",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "_credits",
                    "type": "uint256"
                }
            ],
            "name": "Claim",
            "type": "event"
        }
    ];

    var contract = null; // null if network is not ropsten
    var account = null; // checksummed address or null
    var operator; // checksummed address
    var blocked = false; // true if current operation is unfinished

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

        document.getElementById('file').onchange = function (event) {
            read(event.target.files);
        };

        document.getElementById('serials').ondragenter = function () {
            document.getElementById('serials').style.borderColor = 'blue';
        };
        document.getElementById('serials').ondragleave = function () {
            document.getElementById('serials').style.borderColor = 'black';
        };
        document.getElementById('serials').ondrop = function (event) {
            event.preventDefault();
            document.getElementById('serials').style.borderColor = 'black';
            read(event.dataTransfer.files);
        };
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
                    if (contract !== null && account !== null && account !== operator) {
                        loadAccount(false);
                    }
                });
                contract.methods.operator().call().then(function (result) {
                    operator = web3.utils.toChecksumAddress(result);
                    document.getElementById('loading').style.display = 'none';
                    loadAccounts();
                });
            } else {
                loadAccounts();
            }
        }).catch(function (error) {
            console.error(error);
            if (error.message) {
                error = error.message;
            }
            alert(error);
        });

        function loadAccounts() {
            ethereum.request({
                method: 'eth_accounts'
            }).then(function (accounts) {
                if (accounts.length === 0) {
                    account = null;
                    document.getElementById('connect').style.display = 'block';
                    document.getElementById('user').style.display = 'none';
                    document.getElementById('operator').style.display = 'none';
                } else {
                    var newAccount = web3.utils.toChecksumAddress(accounts[0]);
                    if (newAccount === account) {
                        return;
                    }
                    account = newAccount;
                    document.getElementById('connect').style.display = 'none';
                    if (account === operator) {
                        document.getElementById('user').style.display = 'none';
                        document.getElementById('operator').style.display = 'block';
                    } else {
                        document.getElementById('claimAddress').value = account;
                        document.getElementById('user').style.display = 'block';
                        document.getElementById('operator').style.display = 'none';
                        loadAccount(true);
                    }
                }
            });
        }
    }

    function loadAccount(clear) {
        if (clear) {
            document.getElementById('tokens').innerHTML = '...';
            document.getElementById('retired').innerHTML = '...';
            document.getElementById('claimed').innerHTML = '...';
        }

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
        if (blocked) {
            alert('confirm or reject previous tx');
            return;
        }
        blocked = true;
        var address = document.getElementById('claimAddress').value;
        if (!web3.utils.isAddress(address)) {
            document.getElementById('claimAddressHint').innerHTML = 'address is incorrect';
            blocked = false;
            return;
        }
        document.getElementById('claimAddressHint').innerHTML = '';

        var message;
        contract.methods.claim(address).send({
            from: account
        }).on('transactionHash', function (hash) {
            message = printLog(document.getElementById('userLog'), hash);
            blocked = false;
        }).on('confirmation', function (confirmationNumber, receipt) {
            if (confirmationNumber != 0) {
                return;
            }
            if (!receipt.status) {
                message.innerHTML = ' - rejected';
            } else {
                message.innerHTML = ' - sent tokens for ' +
                    receipt.events.Claim.returnValues._credits + ' carbon credits';
            }
        }).catch(function (error) {
            console.error(error);
            if (error.message) {
                error = error.message;
            }
            alert(error);
            blocked = false;
        });
    }

    function retire() {
        if (blocked) {
            alert('confirm or reject previous tx');
            return;
        }
        blocked = true;
        var serials = parseSerials(
            document.getElementById('serials').value,
            document.getElementById('serialsHint')
        );
        if (!serials) {
            blocked = false;
            return;
        }
        var address = document.getElementById('retireAddress').value;
        if (!web3.utils.isAddress(address)) {
            document.getElementById('retireAddressHint').innerHTML = 'address is incorrect';
            blocked = false;
            return;
        }
        document.getElementById('retireAddressHint').innerHTML = '';

        var message;
        if (document.getElementById('retireAndSend').checked) {
            contract.methods.retireAndSend(address, serials).send({
                from: account
            }).on('transactionHash', function (hash) {
                message = printLog(document.getElementById('operatorLog'), hash);
                blocked = false;
            }).on('confirmation', function (confirmationNumber, receipt) {
                if (confirmationNumber != 0) {
                    return;
                }
                if (!receipt.status) {
                    message.innerHTML = ' - rejected';
                } else {
                    message.innerHTML = ' - sent tokens for ' +
                        receipt.events.RetireAndSend.returnValues._credits + ' carbon credits';
                }
            }).catch(function (error) {
                console.error(error);
                if (error.message) {
                    error = error.message;
                }
                alert(error);
                blocked = false;
            });
        } else {
            contract.methods.retire(address, serials).send({
                from: account
            }).on('transactionHash', function (hash) {
                message = printLog(document.getElementById('operatorLog'), hash);
                blocked = false;
            }).on('confirmation', function (confirmationNumber, receipt) {
                if (confirmationNumber != 0) {
                    return;
                }
                if (!receipt.status) {
                    message.innerHTML = ' - rejected';
                } else {
                    message.innerHTML = ' - retired ' +
                        receipt.events.Retire.returnValues._credits + ' carbon credits';
                }
            }).catch(function (error) {
                console.error(error);
                if (error.message) {
                    error = error.message;
                }
                alert(error);
                blocked = false;
            });
        }
    }

    function read(files) {
        document.getElementById('serialsHint').innerHTML = '';
        if (files.length === 0) {
            return;
        }
        document.getElementById('reading').style.display = 'inline';
        var reader = new FileReader();
        reader.onload = function (event) {
            document.getElementById('reading').style.display = 'none';
            document.getElementById('serials').innerHTML = event.target.result;
        };
        reader.onerror = function (event) {
            console.error(event);
            document.getElementById('reading').style.display = 'none';
            if (event.target.error && event.target.error.message) {
                document.getElementById('serialsHint').innerHTML = event.target.error.message;
            } else {
                document.getElementById('serialsHint').innerHTML = 'cannot read the file';
            }
        };
        reader.readAsText(files[0]);
    }

    function parseSerials(text, hint) {
        var serials = [];
        var startIndex = 0;
        var length = text.length;
        var char;
        for (var i = 0; i < length; i++) {
            char = text.charAt(i);
            if (char >= '0') {
                if (char <= '9') {
                    continue;
                } else if (char !== ']' && char !== '[') {
                    hint.innerHTML = 'incorrect number "' + text.substring(startIndex, i + 1) + '"';
                    return false;
                }
            }
            if (startIndex < i) {
                serials.push(text.substring(startIndex, i));
            }
            startIndex = i + 1;
        }
        if (startIndex < text.length) {
            serials.push(text.substring(startIndex));
        }

        if (serials.length === 0) {
            hint.innerHTML = 'no serial numbers';
            return false;
        }
        hint.innerHTML = '';
        return serials;
    }

    function printLog(div, hash) {
        var p = document.createElement('p');
        p.classList.add('onestring');
        var span = document.createElement('span');
        span.innerHTML = 'tx ';
        p.appendChild(span);
        var a = document.createElement('a');
        a.innerHTML = hash;
        a.href = 'https://ropsten.etherscan.io/tx/' + hash;
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener');
        p.appendChild(a);
        span = document.createElement('span');
        span.innerHTML = ' - unconfirmed';
        p.appendChild(span);
        div.insertBefore(p, div.firstChild);
        return span;
    }
})();