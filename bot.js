const 	SteamUser 			= require('steam-user')
	, 	TradeOfferManager 	= require('steam-tradeoffer-manager')
	, 	SteamTotp 			= require('steam-totp')
	, 	SteamCommunity 		= require('steamcommunity');

const 	fs 		= require('fs')
	,	request = require('request');

const config = require('./config.json');

const 	client 		= new SteamUser()
	, 	community 	= new SteamCommunity();

const manager = new TradeOfferManager({
    steam: 		client,
    community: 	community,
    language: 	'en'
});

const priceUrl = 'https://api.csgofast.com/price/all';

///

client.logOn({
	"accountName": 		config.username,
	"password": 		config.password,
	"twoFactorCode": 	SteamTotp.generateAuthCode(config.sharedSecret)
});
client.on('loggedOn', () => {
	console.log("Logged into Steam as " + client.steamID.getSteam3RenderedID());
	client.setPersona(SteamUser.EPersonaState.Online);
	getPrice();
});

client.on('webSession', (sessionid, cookies) => {
	manager.setCookies(cookies, function(err) {
		if (err) {
			console.log(err);
			process.exit(1);
			return;
		}
		console.log("Got API key: " + manager.apiKey);
	});

	community.setCookies(cookies);
	community.startConfirmationChecker(30000, config.identitySecret);
});

///

manager.on('newOffer', (offer) => {
	var userID 	= offer.partner.getSteamID64();
	var offerID = offer.id;

	var prefix = offerID + ' || ';

	console.log("New offer #" + offerID + " from " + userID);

	offer.getUserDetails((err, me, them) => {
		if(err) {
			console.log(err);
			return;
		}

		if(them.escrowDays > 0) {
			console.log(prefix +'User has escrow! Declining!');
			offer.decline((err) => {
				if(err) {
					console.log(prefix + 'Error declining offer!');
					return;
				}
			});			
		} else {
			if(offer.itemsToGive.length == 0) {
				client.chatMessage(userID, config.options.chatResponse.donation);
				console.log(userID + ' Just Donated us skins!');

				console.log(prefix + 'Accepting offer!');
				offer.accept((err, status) => {
					if(err) {
						console.log(prefix + 'Error accepting offer!');
						return;
					} else {
						community.checkConfirmations();
					}
				});
			} else {
				if(getPrices(offer.itemsToGive) > (getPrices(offer.itemsToReceive) * config.options.percentamount)) {
					client.chatMessage(userID, config.options.chatResponse.tradeDeclined);

					console.log(prefix +'User ask for more then he/she gives! Declining!');
					offer.decline((err) => {
						if(err) {
							console.log(prefix + 'Error declining offer!');
							return;
						}
					});
				} else if(getPrices(offer.itemsToGive) < (getPrices(offer.itemsToReceive) * config.options.percentamount)) {
					client.chatMessage(userID, config.options.chatResponse.tradeAccepted);

					console.log(prefix + 'Accepting offer!');
					offer.accept((err, status) => {
						if(err) {
							console.log(prefix + 'Error accepting offer!');
							return;
						} else {
							community.checkConfirmations();
						}
					});				
				}
			}
		}
	});
});


manager.on('pollData', function(pollData) {
	fs.writeFile('polldata.json', JSON.stringify(pollData));
});

if (fs.existsSync('polldata.json')) {
	manager.pollData = JSON.parse(fs.readFileSync('polldata.json'));
}

///

function getPrice() {
	request(priceUrl, (error, response, body) => {
		if (!error && response.statusCode === 200) {
			var jsonResponse = JSON.parse(body);
			fs.writeFile('prices.json', body);
		} else {
			console.log("Got an error: ", error, ", status code: ", response.statusCode);
		}
	});
}

function exists(id) {
	for (var i = 0; i < config.acceptSteamIDS.length; i++) {
		if (config.acceptSteamIDS[i] == id) {
			return true;
		}
	return false;
	}
}

function getPrices(offer) {
	var prices = require('./prices.json');
	var x = 0;
	if (offer == null) {
		offer = {'market_hash_name': 200};
	}
	for (var i = 0; i < offer.length; i++) {
		x = x +prices[offer[i].market_hash_name];
	}
	return x;
}