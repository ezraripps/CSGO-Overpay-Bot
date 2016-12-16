const SteamUser = require('steam-user');
const TradeOfferManager = require('steam-tradeoffer-manager');
const SteamTotp = require('steam-totp');
const SteamCommunity = require('steamcommunity');
const fs = require('fs');
const request = require('request');
const config = require('./config.json');

const community = new SteamCommunity();
const client = new SteamUser();
const manager = new TradeOfferManager({
	steam: client,
	domain: 'example.com',
	language: 'en'
});

const priceUrl = 'https://api.csgofast.com/price/all';

function getPrices(offer) {
	let offervalue = 0;

	if (offer) {
		let prices = require('./prices.json');

		offer.forEach((item) => {
			offervalue += prices[item.market_hash_name];
		});
	}

	return offervalue;
}

function acceptOffer(offer) {
	offer.accept((err) => {
		if (err) {
			console.log(`Unable to accept offer: ${err.message}`);
		} else {
			community.checkConfirmations();
		}
	});
}

function getPrice() {
	request(priceUrl, (error, response, body) => {
		if (!error && response.statusCode === 200) {
			fs.writeFile('prices.json', body);
		} else {
			console.log(`Error: ${error} - Status Code: ${response.statusCode}`);
		}
	});
}

getPrice();
setInterval(getPrice, config.options.priceRefreshInterval * 1000);

client.logOn({
	accountName: config.username,
	password: config.password,
	twoFactorCode: SteamTotp.generateAuthCode(config.sharedSecret)
});

manager.on('pollData', function(pollData) {
	fs.writeFile('polldata.json', JSON.stringify(pollData));
});

if (fs.existsSync('polldata.json')) {
	manager.pollData = JSON.parse(fs.readFileSync('polldata.json'));
}

client.on('loggedOn', function(details) {
	console.log(`Logged into Steam as ${client.steamID.getSteam3RenderedID()}`);
 	client.setPersona(SteamUser.Steam.EPersonaState.Online,config.botname);
});

client.on('webSession', function(sessionID, cookies) {
	manager.setCookies(cookies, function(err) {
		if (err) {
			throw(err);
		}

		console.log(`Got API key: ${manager.apiKey}`);
	});

	community.setCookies(cookies);
	community.startConfirmationChecker(config.options.confirmationInterval, config.identitySecret);
});

manager.on('newOffer', function(offer) {
	const partnerid = offer.partner.getSteamID64();

	console.log(`New offer # ${offer.id} from ${partnerid}`);

	if (!offer.itemsToGive.length) {
		console.log(`${partnerid} just donated us skins!`);

		client.chatMessage(partnerid, config.options.chatResponse.donation);
		acceptOffer(offer);
	} else {
		if (getPrices(offer.itemsToGive) > getPrices(offer.itemsToReceive) * config.options.percentamount) {
			client.chatMessage(partnerid, config.options.chatResponse.tradeDeclined);
			offer.decline(function(err) {
				if (err) {
					console.log(`Unable to decline offer: ${err.message}`);
				}
			});
		} else if (getPrices(offer.itemsToGive) <= getPrices(offer.itemsToReceive) * config.options.percentamount) {
			client.chatMessage(partnerid, config.options.chatResponse.tradeAccepted);
			acceptOffer(offer);
		}
	}
});
