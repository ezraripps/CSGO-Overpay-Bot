# CSGO-Overpay-bot

### Setup

```BASH
  npm install
  node bot.js
```
Then add your username, password, account secrets and API key to `config.json`

**To get a free API key, visit https://steamapi.io/user and login with steam!**

### Config elements
- `username` Steam account username
- `password` Steam account password
- `botname` Steam name of bot, leave empty for no change
- `identitySecret` AND `sharedSecret` You get these from [Steam Desktop Authenticator](https://github.com/Jessecar96/SteamDesktopAuthenticator/releases/tag/1.0.7.2) and de-crypting the files
- `adminIDs` An array of Steam64 IDs to auto-accept trades from
- `options`
	- `apiKey` Your API key from https://steamapi.io/ as mentioned above
	- `appid` Steam App ID to get prices from, 730 (CS:GO) is default not tested to work with others but could
	- `minimumprice` Minimum value for total trade.
	- `acceptRandomFriendRequests` Should the bot accept incoming friend requests
	- `priceRefreshInterval` Time (in seconds) to refresh price
	- `confirmationInterval` Time (in seconds) to check mobile auth
	- `percentamount` Percent to value their items at EX: 95% would be 0.95 in config
	- `minItemValue` Minimum value for each item, declines trade otherwise. 0 to disable.
	- `chatResponse` Chat message handling
		- `donation` Message to send to user when they donate skins
		- `junk` Message to send when users items are less then `minimumprice`
		- `tradeDeclined` Message to send when users items have less value then bots items
		- `tradeAccepted` Message to send when trade goes through
		- `newFriend` Message to send to user when they add the bot
		- `adminTrade` Sent to admin (from `adminIDs`) when they make a (auto-accepted) trade to the bot
		- `commands` Custom simple commands, JSON object in form of `"!command": "res"`

### CONTRBUTING
If you want to contrubuite you must follow theese rules
- Adding elements to config requires you to update README.md
- You must comment your code sufficently
- You have to add enough for it to be merged, EX: i will not merge adding one comment
- Obviously make sure personal details are out of config when makng a PR
- Leave placeholder commands and responces in
- Dont add anything to the bot to scam people
