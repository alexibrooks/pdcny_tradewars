// RunningGames = Mongo.Collection("games");
// AllStocks = Mongo.Collection("stocks");
// Alerts = Mongo.Collection("alerts")

// import { RunningGames } from 'server/server.js';
// import { AllStocks } from 'server/server.js';
// import { Alerts } from 'server/server.js';


if (Meteor.isClient) {
	// Template.registerForm.event
	Template.body.events ({
		'click .logOut': function () {
			// console.log("logging out?");
			AccountsTemplates.logout();
			Router.go('/');
		}
	});

	Template.userInfo.helpers ({
		groupID: function () {
			return Session.get("GroupNo");
		},

		userID: function () {
			return Meteor.user().username;
		}
	});

	Template.alertsTemp.helpers({
		allAlerts: function () {
			return Alerts.find({$and: [{"gameCode": Session.get("GameCode")}, {"user": Meteor.userId()}, {type: "alert"}, {"contents.read": 0}]});
		}
	});

	Template.alertsTemp.events({
		'submit .clear-alerts' : function (event) {
			event.preventDefault();
			Meteor.call('raiseAlert', Meteor.userId(), "clearall", Session.get("GameCode"));
		}
	});

	Template.requestsTemp.helpers({
		allRequests: function () {
			return Alerts.find({$and: [{gameCode: Session.get("GameCode")}, {user: Meteor.userId()}, {type: "request"}, {"contents.read": 0}]});
		}
	});

	Template.requestsTemp.events({
		"click input[type=submit]": function(e) {
			reqId = $(e.target)[0].form.className;
			request = Alerts.findOne({_id: reqId}).contents;
			acceptance = false;
			if($(e.target).prop("id") == "accept"){
				// console.log("accept");
				e.preventDefault();
				reqResStock = AllStocks.findOne({$and: [{gID: Session.get("GroupNo")}, {gameCode: Session.get("GameCode")}, {item: request["reqRes"]}]});
				if (reqResStock == undefined){
					Meteor.call("raiseAlert", Meteor.userId(), "Your group doesn't have the item you're trying to give! Trade fails", Session.get("GameCode"));
					acceptance = false;
				}
				else if(reqResStock.amount < request["reqAmt"]){
					Meteor.call('raiseAlert', Meteor.userId(), "Your group doesn't have enough of the item you're trying to give! Trade fails", Session.get("GameCode"));
					acceptance = false;
				}
				else{
					Meteor.call('exchangeResources', reqId, Session.get("GameCode"));
					Meteor.call('raiseAlert', Meteor.userId(), "Request completed, you have the things you requested for!", Session.get("GameCode"));
					acceptance = true;
				}
			}
			else{
				// console.log("reject");
				e.preventDefault();
				acceptance = false;
				// console.log("reject", $(e.target).prop("fNo"));
			}

			if(acceptance == false){
				Meteor.call('raiseAlert', request["requester"].id, "Request rejected/failed.", Session.get("GameCode"));
			}
			else {
				Meteor.call('raiseAlert', request["requester"].id, "Request accepted! Woohoo", Session.get("GameCode"));	
			}
			Meteor.call('readRequest', reqId);
		}
	});

	Template.stockInfo.helpers ({
		resources: function () {
			// return AllStocks.findOne({gID: groupID}).market;
			console.log("stockin");
			if (Session.get("GroupNo") == "admin"){
				return AllStocks.find({gameCode: Session.get("GameCode")});	
			}
			else if (Session.get("GroupNo") != "none"){
				return AllStocks.find({$and: [{gID: Session.get("GroupNo")}, {gameCode: Session.get("GameCode")}]});
			}
		}

	});

	Template.hello.helpers({
		counter: function () {
			return Session.get('counter');
		}
	});

	Template.hello.events({
		'click button': function () {
			// increment the counter when button is clicked
			Session.set('counter', Session.get('counter') + 1);
		}
	});


	Template.trade.helpers({
		otherUsers: function () {
			return RunningGames.find({$and: [{gameCode: Session.get("GameCode")}, {player: {$ne: Meteor.userId()}}, {group: {$ne: "admin"}}]}, {playerName: 1});

		},

		givingResources: function () {
			return AllStocks.find({$and: [{"gameCode": Session.get("GameCode")}, {"gID": Session.get("GroupNo")}, {"amount": {$gt: 0}}] }, {"item": 1, "amount": 1});
		},

		allResources: function () {
			ar = AllStocks.find({$and: [{"gameCode": Session.get("GameCode")}, {"amount": {$gt: 0}}]}, {"item": 1}).fetch();
			distinctArray = _.uniq(ar, false, function(d) {return d.item});
			distinctValues = _.pluck(distinctArray, 'item');
			ar = distinctValues.map(function (x){return {"item": x}});
			return ar;
		}

	});

	Template.trade.events({
		"submit .trade": function (event) {
			// console.log("trast");
			event.preventDefault();
			var checkAvailability = function(res, amt) {
				a = parseInt(AllStocks.find({$and: [{"gameCode": Session.get("GameCode")}, {"gID": Session.get("GroupNo")}, {"item": res}, {"amount": {$gte: parseInt(amt)}}]}).fetch().length);
				// console.log(a != 0);
				if (a > 0){
					console.log("tru");
					return true;
				}
				else {
					console.log("fal");
					return false;
				}
			}

			if (checkAvailability(event.target.GivingResource.value, event.target.giveAmount.value)){
				// console.log(event.target.Recipient.value, Meteor.userId(), event.target.GivingResource.value, event.target.giveAmount.value, event.target.TakingResource.value, event.target.requestAmount.value);
				Meteor.call('reqTrade', Session.get("GameCode"), event.target.Recipient.value, Meteor.userId(), event.target.GivingResource.value, event.target.giveAmount.value, event.target.TakingResource.value, event.target.requestAmount.value, function (error, result){
					if (error){
						Meteor.call('raiseAlert', Meteor.userId(), "Request sending failed due to server's fault. Find the owners of the internets and shout at them.", Session.get("GameCode"));
					}
					else {
						Meteor.call('raiseAlert', Meteor.userId(), "Sent Request", Session.get("GameCode"));
					}
				});
			}
			else{
				Meteor.call('raiseAlert', Meteor.userId(), "Request sending failed – probably not enough resource", Session.get("GameCode"));
			}			
		}
	});

	Template.baseDash.helpers({
		adminGames() {
			// console.log(RunningGames.find({'admin': Meteor.userId()}).fetch());
			return RunningGames.find({$and: [{'player': Meteor.userId()}, {'group': 'admin'}]});
		},
		
		playingGames() {
			return RunningGames.find({$and: [{'player': Meteor.userId()}, {'group': {$ne: 'admin'}}]});
		},
	});

	Template.baseDash.events({
		'click .host': function(event, instance) {
			event.preventDefault();
			newGameCode = 0;
			Meteor.call('makeNewGame', Meteor.userId(), function(error, result) {
				if(error){
					alert("Error!");
				}
				else{
					newGameCode = result;
					Router.go("/games/" + newGameCode);
				}
			});
		},

		'submit .gameChoice': function(event) {
			event.preventDefault();
			gCode = event.target.gameCode.value;
			Meteor.call('joinGame', gCode, Meteor.userId(), function(err, result) {
				if (err){
					alert("Errorr");
				}
				else {
					console.log(result);
					if (result == "Invalid game code"){
						alert("That game does not exist");
					}
					else {
						Router.go("/games/" + gCode);
					}
				}
			});
			// }
		}
	});

}


