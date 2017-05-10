# CSGO-Overpay-bot

### Setup
If you haven't done so already please install nodejs.
Open windows start menu and find cmd.exe (command prompt) and open it.
Then follow these steps:
```BASH
  cd {the dir of the folder} //EX: cd C:/users/arze/desktop/CSGO-Overpay-Bot 
  npm i
  node bot.js
```
Add your username, password, secrets, and api key to config for the bot to work correctly.

TO GET A API KEY GO TO https://steamapi.io/user AND LOGIN WITH STEAM. THIS IS NOT A STEAMCOMMUNITY API KEY!

### Config elements
- `username` AND `password` are the credentials of your steam account you will be using for the bot.
- `botname` What you want the bots profile name to be, leave blank to not change
- `identitySecret` AND `sharedSecret` You get theese from [Steam Desktop Authenticator](https://github.com/Jessecar96/SteamDesktopAuthenticator/releases/tag/1.0.7.2) and de-crypting the files
- `adminIDs` An array of steam64 ids to auto-accept trades from
- `options`
	- `apiKey` An api key from https://steamapi.io/ as mentioned above
	- `appid` AppID to get prices from. 730 (CS:GO) is default id. Other ID's are not tested to work, but still may.
	- `minimumprice` Minium value for their items
	- `acceptRandomFriendRequests` boolean value, accepts any friend requests sent to the provided bot account.
	- `priceRefreshInterval` Time (in seconds) to renew pricelist
	- `confirmationInterval` Time (in seconds) to check mobile trade authentication.
	- `percentamount` Percent to value users items at. ex: 95% would be 0.95 in config
	- `minPricePerItem` Minimum price for items for them to be valued. ex: if set to 0.10 any item under 10 cents would be worth nothing
	- `chatResponse` Chat message handling
		- `donation` Message to send to user when they donate skins
		- `junk` Message to send when users items are less then `minimunprice`
		- `tradeDeclined` Message to send when users items have less value then bots items
		- `tradeAccepted` Message to send when trade goes through
		- `newFriend` Message to send to user when they add the bot
		- `unknownCommand` Message to send to user when they send you a message that is not a command
		- `adminTrade` Sent to admin when they make a (auto-accepted) trade to the bot NOTE: admins can be configured in `adminIDs`
		- `commands` Custom simple commands, JSON object in form of "!command"
: "res"





### CONTRBUTING
If you want to contribute you must follow these rules
- Adding elements to config requires you to update README.md
- You must comment your code sufficently
- You have to add enough for it to be merged, EX: i will not merge adding one comment
- Obviously make sure personal details are out of config when makng a PR
- Leave placeholder commands and responces in
- Dont add anything to the bot to scam people
