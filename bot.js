/*
	Initalizing ALL Modules
*/
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

//Priceing API url
const priceUrl = 'http://api.arze.io/v1/min'; //My API :)

function getPrices(offer) {
	let offervalue = 0;

	if (offer) {

		let prices = require('./prices.json'); //Requiring price file

		//Loop through offer and get total price
		offer.forEach((item) => {
			offervalue += prices[item.market_hash_name];
		});
	}

	return offervalue; //Return Total offer value
}

/*
	Friend requests and Chat
*/
client.on('friendRelationship', (steamid, relationship) => {
	if (relationship === 2 && config.options.acceptRandomFriendRequests) {
		client.addFriend(steamid);
		client.chatMessage(steamid, config.options.chatResponse.newFriend);
	}
});

client.on('friendMessage', function(steamID, message) {
	console.log(config.options.chatResponse.commands[message]);
	if (config.options.chatResponse.commands[message]) {
		client.chatMessage(steamID, config.options.chatResponse.commands[message]);
	}
});

/*
	Getting price from API
*/
function getPrice() {
	request(priceUrl, (error, response, body) => {
		if (!error && response.statusCode === 200) {
			fs.writeFile('prices.json', body);
		} else {
			console.log(`Error: ${error} - Status Code: ${response.statusCode}`);
		}
	});
}

getPrice(); //Iniatate First price request

setInterval(getPrice, config.options.priceRefreshInterval * 1000); //Auto Refresh price




/*
	OFFER HANDLING
*/
//function to accept a offer
function acceptOffer(offer) {
	offer.accept((err) => {
		if (err) {
			console.log(`Unable to accept offer: ${err.message}`);
		} else {
			community.checkConfirmations();
		}
	});
}

manager.on('newOffer', function(offer) {
	const partnerid = offer.partner.getSteamID64(); //Getting Offer partner steamid

	offer.getUserDetails((err, me, them) => {
		if(err) {
			log(err);
			return;
		}

		if(them.escrowDays > 0) {
			console.log('User has escrow! Declining!');
			offer.decline((err) => {
				if(err) {
					console.log('Error declining offer!');
					return;
				}
			});
		}
	});

	console.log(`New offer # ${offer.id} from ${partnerid}`);

	if (!offer.itemsToGive.length) {
		console.log(`${partnerid} just donated us skins!`);

		client.chatMessage(partnerid, config.options.chatResponse.donation); //Sending message for donations
		acceptOffer(offer);
	} else {
		if (getPrices(offer.itemsToGive) > getPrices(offer.itemsToReceive) * config.options.percentamount) {
			client.chatMessage(partnerid, config.options.chatResponse.tradeDeclined); //Sending message when trade declined
			offer.decline(function(err) { //declineing offer
				if (err) {
					console.log(`Unable to decline offer: ${err.message}`);
				}
			});
		} else if (getPrices(offer.itemsToGive) <= getPrices(offer.itemsToReceive) * config.options.percentamount) {
			client.chatMessage(partnerid, config.options.chatResponse.tradeAccepted); //Sending message for accepting offer
			acceptOffer(offer); //accepting offer
		}
	}
});

/*
	Polling Steam and Logging On
*/

//Logging In
client.logOn({
	accountName: config.username,
	password: config.password,
	twoFactorCode: SteamTotp.generateAuthCode(config.sharedSecret)
});

//Refresh polldata.json
manager.on('pollData', function(pollData) {
	fs.writeFile('polldata.json', JSON.stringify(pollData));
});
if (fs.existsSync('polldata.json')) {
	manager.pollData = JSON.parse(fs.readFileSync('polldata.json'));
}

//Logged ON listener
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
	community.startConfirmationChecker(config.options.confirmationInterval, config.identitySecret); //Starting checker for mobile confirmations
});
