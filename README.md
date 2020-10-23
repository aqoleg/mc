# mc

This is a submission for the quadratic funding [hackathon](https://gitcoin.co/issue/MPlus4Climate/MPlusToolKit/1/100023834).

## precondition

Use any up-to-date browser with [metamask](https://metamask.io) installed.

## usage

Import private [keys](https://github.com/aqoleg/mc/blob/main/keys) into metamask.
There are 3 types of accounts:
* operator - carbon credit authority
* fund - M+ global community development fund
* holders - net reducers, entities that retire carbon credits

Open the [app](https://aqoleg.github.io/mc/), select ropsten testnet and connect with metamask.
The app has different interfaces for the operator and for any other account, depending on which account is currently open.

To receive M+C tokens, the holder provides the operator with his/her ethereum address. The operator enters this address and serial numbers of carbon credits that this holder had retired. Each carbon credits has unique serial number and can be retired only once. Some examples of serial numbers are [here](https://github.com/aqoleg/mc/blob/main/serials). The maximum number of serial numbers that can be retired in one tranaction is around 300 and depends on the gas limit of the ethereum block. The operator can choose to send tokens directly to the holder, or allow the holder to claim tokens manually.

The holder's user interface displays the holder's balance in M+C tokens, the number of all carbon credits that the holder has retired, and the number of retired carbon credits that had been converted to tokens. If there are unclaimed tokens, the holder can claim them on the specified address.

M+C token is the fully-compatible erc20 token. For each retired carbon credit, 100 M+C tokens can be issued, 10% of which goes to the fund. The operator can change this percentage.

[Watch](https://aqoleg.github.io/mc/docs/index.html) or [download](https://github.com/aqoleg/mc/raw/main/docs/video.mp4) the demo video.

## contacts

Feel free to communicate.

aqoleg@pm.me

[t.me/aqoleg](https://t.me/aqoleg)