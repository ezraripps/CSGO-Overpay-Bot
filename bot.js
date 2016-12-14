var SteamUser = require('steam-user');
var TradeOfferManager = require('steam-tradeoffer-manager');
var SteamTotp = require('steam-totp');
var SteamCommunity = require('steamcommunity');
var fs = require('fs');
var request = require('request');


var config = require('./config.json');
var community = new SteamCommunity();
var client = new SteamUser();
var manager = new TradeOfferManager({
	"steam": client,
	"domain": "example.com",
	"language": "en"
});
var url = 'https://api.csgofast.com/price/all';

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


client.logOn({
	"accountName": config.username,
	"password": config.password,
	"twoFactorCode": SteamTotp.generateAuthCode(config.sharedSecret)
});

manager.on('pollData', function(pollData) {
	fs.writeFile('polldata.json', JSON.stringify(pollData));
});

if (fs.existsSync('polldata.json')) {
	manager.pollData = JSON.parse(fs.readFileSync('polldata.json'));
}

client.on('loggedOn', function(details) {
	console.log("Logged into Steam as " + client.steamID.getSteam3RenderedID());
 	client.setPersona(SteamUser.Steam.EPersonaState.Online,config.botname);
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

function getPrices(offer) {
	var offervalue = 0;
	if (offer != null) {
		var prices = require('./prices.json');
		for (var i = 0; i < offer.length; i++) {
			offervalue += prices[offer[i].market_hash_name];
		}	
	} 
	return offervalue;
}

function acceptOffer (offer) {
	offer.accept(function(err) {
		if (err) {
			console.log("Unable to accept offer: " + err.message);
		} else {
			community.checkConfirmations();
		}
	});
}
manager.on('newOffer', function(offer) {
	var partnerid = offer.partner.getSteamID64();
	console.log("New offer #" + offer.id + " from " + ID);
	if (offer.itemsToGive.length == 0) {
		client.chatMessage(partnerid, config.options.chatResponse.donation);
		console.log(partnerid + ' Just Donated us skins!');
		acceptOffer (offer);
	} else {
		if (getPrices(offer.itemsToGive) > getPrices(offer.itemsToReceive)*config.options.percentamount) {
			client.chatMessage(partnerid, config.options.chatResponse.tradeDeclined);
			offer.decline(function(err) {
				if (err) {
					console.log("Unable to decline offer: " + err.message);
				}
			});
		} else if (getPrices(offer.itemsToGive) < getPrices(offer.itemsToReceive)*config.options.percentamount) {
			client.chatMessage(partnerid, config.options.chatResponse.tradeAccepted);
			acceptOffer (offer);
		}
	}
});
