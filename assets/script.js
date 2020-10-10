"use strict";

(function () {
    var contractAddress = '0x838ea31Ab7Ca34195605436aB21AE3EB16CFfb36';
    var abi = [
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
            "name": "IssueCarbonCredits",
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
            "name": "RetireCarbonCredits",
            "type": "event"
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
                    "name": "_serials",
                    "type": "uint256[]"
                }
            ],
            "name": "issueCarbonCredits",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "owner",
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
                    "name": "_holder",
                    "type": "address"
                },
                {
                    "internalType": "uint256[]",
                    "name": "_serials",
                    "type": "uint256[]"
                }
            ],
            "name": "retireCarbonCredits",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ];

    var page = true;
    var contract = null;
    var owner = null;

    window.onload = function () {
        document.getElementById('headerIssue').onclick = function () {
            setPage(true);
        }
        document.getElementById('headerRetire').onclick = function () {
            setPage(false);
        }
        document.getElementById('issueButton').onclick = issue;
        document.getElementById('retireButton').onclick = retire;

        var script = document.createElement('script');
        script.src = 'assets/web3.min.js';
        script.onload = function () {
            if (typeof window.ethereum === 'undefined') {
                document.getElementById('notSupported').style.display = 'block';
            } else {
                window.web3 = new Web3(ethereum);
                ethereum.request({method: 'net_version'}).then(function (network) {
console.log('net_version');
console.log(network);
                    setNetwork(Number(network));
                });
                ethereum.on('chainChanged', function (network) {
console.log('chainChanged');
console.log(network);
                    setNetwork(Number(network));
                });
                ethereum.autoRefreshOnNetworkChange = false;
            }
            document.getElementById('loading').style.display = 'none';
        };
        document.body.appendChild(script);
    };

    function setPage(newPage) {
        if (page === newPage) {
            return;
        }
        page = newPage;
        document.getElementById('issue').style.display = page ? 'block' : 'none';
        document.getElementById('retire').style.display = page ? 'none' : 'block';
        document.getElementById('headerIssue').className = page ? 'active' : '';
        document.getElementById('headerRetire').className = page ? '' : 'active';
    }

    function setNetwork(network) {
        if (network !== 3) {
            contract = null;
            document.getElementById('switchNetwork').style.display = 'block';
        } else if (contract === null) {
            contract = new web3.eth.Contract(abi, contractAddress);
            document.getElementById('switchNetwork').style.display = 'none';
            contract.methods.owner().call().then(function (result) {
console.log(result);
                owner = result;
            });
        }
    }

    function issue() {
        var address = document.getElementById('issueAddress').value;
        if (!web3.utils.isAddress(address)) {
            document.getElementById('issueAddressHint').innerHTML = 'enter valid address';
            return;
        }
        document.getElementById('issueAddressHint').innerHTML = '';
        var serials = parseSerials(document.getElementById('issueSerials').value, document.getElementById('issueSerialsHint'));
        if (!serials) {
            return;
        }
        if (contract === null) {
            alert('change the network');
            return;
        }

        var message;
        ethereum.request({
            method: 'eth_requestAccounts'
        }).then(function (accounts) {
            if (owner !== web3.utils.toChecksumAddress(accounts[0])) {
                alert('unauthorized!');
                return;
            }

            var message;
            contract.methods.issueCarbonCredits(address, serials).send({
                from: accounts[0]
            }).on('transactionHash', function (hash) {
                message = printLog(document.getElementById('issueLog'), hash);
            }).on('confirmation', function (confirmationNumber, receipt) {
                if (confirmationNumber == 0) {
                    if (!receipt.status) {
                        message.innerHTML = ', rejected';
                    } else {
                        message.innerHTML = ', issued ' + receipt.events.IssueCarbonCredits.returnValues._credits + ' carbon credits';
                    }
console.log(receipt);
                }
            }).catch(function (error) {
                console.error(error.message);
            });
        });
    }

    function retire() {
        var address = document.getElementById('retireAddress').value;
        if (!web3.utils.isAddress(address)) {
            document.getElementById('retireAddressHint').innerHTML = 'enter valid address';
            return;
        }
        document.getElementById('retireAddressHint').innerHTML = '';
        var serials = parseSerials(document.getElementById('retireSerials').value, document.getElementById('retireSerialsHint'));
        if (!serials) {
            return;
        }
        if (contract === null) {
            alert('change the network');
            return;
        }

        var message;
        ethereum.request({
            method: 'eth_requestAccounts'
        }).then(function (accounts) {
            if (owner !== web3.utils.toChecksumAddress(accounts[0])) {
                alert('unauthorized!');
                return;
            }

            var message;
            contract.methods.retireCarbonCredits(address, serials).send({
                from: accounts[0]
            }).on('transactionHash', function (hash) {
                message = printLog(document.getElementById('retireLog'), hash);
            }).on('confirmation', function (confirmationNumber, receipt) {
                if (confirmationNumber == 0) {
                    if (!receipt.status) {
                        message.innerHTML = ', rejected';
                    } else {
                        message.innerHTML = ', retired ' + receipt.events.RetireCarbonCredits.returnValues._credits + ' carbon credits';
                    }
console.log(receipt);
                }
            }).catch(function (error) {
                console.error(error.message);
            });
        });
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