var SteamUser = require('steam-user');
var client = new SteamUser();
var TradeOfferManager = require('steam-tradeoffer-manager');
var config = require('./config.json');
var SteamTotp = require('steam-totp');
var SteamCommunity = require('steamcommunity');
var community = new SteamCommunity();
var fs = require('fs');
var manager = new TradeOfferManager({
	"steam": client,
	"domain": "example.com",
	"language": "en"
});
var request = require('request'),
	url = 'https://api.csgofast.com/price/all';

function getPrice() {
	request(url, (error, response, body) => {
		if (!error && response.statusCode === 200) {
			var jsonResponse = JSON.parse(body);
			fs.writeFile('prices.json', body);
		} else {
			console.log("Got an error: ", error, ", status code: ", response.statusCode);
		}
	});
}
getPrice();
setInterval(function() {
	getPrice();
}, 30 * 1000);
function logOn() {
	client.logOn({
		"accountName": config.username,
		"password": config.password,
		"twoFactorCode": SteamTotp.generateAuthCode(config.sharedSecret)
	});
}
logOn();

client.on('webSession', function(sessionID, cookies) {
	manager.setCookies(cookies, function(err) {
		if (err) {
			console.log(err);
			process.exit(1);
			return;
		}
	});
});

manager.on('pollData', function(pollData) {
	fs.writeFile('polldata.json', JSON.stringify(pollData));
});

if (fs.existsSync('polldata.json')) {
	manager.pollData = JSON.parse(fs.readFileSync('polldata.json'));
}

client.on('loggedOn', function(details) {
	console.log("Logged into Steam as " + client.steamID.getSteam3RenderedID());
	client.setPersona(SteamUser.EPersonaState.Online);
});

var manager = new TradeOfferManager({
	"steam": client,
	"domain": "nothinghere",
	"language": "en"
});

client.on('webSession', function(sessionID, cookies) {
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

manager.on('newOffer', function(offer) {
	var ID = offer.partner.getSteamID64();
		console.log("New offer #" + offer.id + " from " + ID);
	function accept() {
		offer.accept(function(err) {
			if (err) {
				console.log("Unable to accept offer: " + err.message);
			} else {
				community.checkConfirmations();
			}
		});
	}
	if (offer.itemsToGive.length == 0) {
		client.chatMessage(ID, config.options.chatResponse.donation);
		console.log(ID + ' Just Donated us skins!');
		accept();
	} else {
		if (getPrices(offer.itemsToGive) > getPrices(offer.itemsToReceive)*config.options.percentamount) {
			client.chatMessage(ID, config.options.chatResponse.tradeDeclined);
				offer.decline(function(err) {
			if (err) {
				console.log("Unable to decline offer: " + err.message);
			}
		});
		} else if (getPrices(offer.itemsToGive) < getPrices(offer.itemsToReceive)*config.options.percentamount) {
			client.chatMessage(ID, config.options.chatResponse.tradeAccepted);
			accept();
		}
	}
});
