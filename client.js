// collection of everybody's markets
// each document is groupID, price of wood, graphite, and so on
// as well as 

// collection of Users has groupID information as well

// collection of all the groups' stocks

// import { Meteor } from 'meteor/meteor';
// import { Template } from 'meteor/templating';
// import { Router } from 'meteor/iron:router';

// import { RunningGames } from './server/main.js';
// import { AllStocks } from './server/main.js';

groupIDs = ["g1", "g2", "g3", "g4"];
// resources = ["a", "b", "c", "d"]

// RunningGames = new Mongo.Collection("games");
// AllStocks = new Mongo.Collection("stocks");

// Router.route('/', function() {
// 	this.render('Home');
// });

// Router.route('/games/:gameCode', function() {
// 	// console.log(this.params.gameCode);
// 	var gameCode = parseInt(this.params.gameCode);
// 	// console.log(gameCode);
// 	//check presence of user in game
// 		//if not, then redirect back to home, with alert "Not in game"
// 	role = "none";
// 	if (RunningGames.findOne({$and: [{"accessCode": gameCode}, {"admin": Meteor.userId()}] }) != undefined) {
// 		// console.log("found admin");
// 		role = "adminDash";
// 	}
// 	else if (RunningGames.findOne({$and: [{"accessCode": gameCode}, {"users": Meteor.userId()}]}) != undefined) {
// 		// console.log("found admin");
// 		role = "userDash";
// 	}
// 	else {
// 		// console.log("not found");
// 		Session.set("GameCode", 0);
// 		// alert("Not in that game!");
// 		// role = ""
// 		// Router.go("/");
// 	}
// 	if (role == "none"){
// 		alert("Not in this game");
// 		Router.go("/");
// 	}
// 	else{
// 		this.render(role, {
// 			data: {
// 				gameCode: this.gameCode
// 			}
// 		});
// 		Session.set("GameCode", gameCode);
// 	}
// });

if (Meteor.isClient) {
	Template.userInfo.helpers ({
		groupID: function () {
			Meteor.call("getGameDocument", Session.get("GameCode"), Meteor.userId(), function (error, result) {
				if (error) {
					return "Error";
				}
				else {
					return result.users.group;
				}
			})
			// return RunningGames.findOne({$and: [{accessCode: Session.get("GameCode")}, {users.id: Meteor.userId()}]}).users.group;
		},

		userID: function () {
			return Meteor.userId();
		}
	});

	Template.alerts.helpers({
		allAlerts: function () {
			return Meteor.user().profile.alerts;
		}
	});

	Template.alerts.events({
		'submit .clear-alerts' : function (event) {
			event.preventDefault();
			// console.log(Meteor.user().profile.alerts)
			// Meteor.users.update({_id: Meteor.userId()}, {$set: {"profile.alerts": []}});
			Meteor.call('raiseAlert', Meteor.userId(), "clearall");
		}
	});

	Template.requests.helpers({
		allRequests: function () {
			// if (Meteor.user().profile.requests != undefined)

			return Meteor.user().profile.requests.filter(function (x) { return x["replied"] == false; });
		}
	});

	Template.requests.events({
		"click input[type=submit]": function(e) {
			reqno = $(e.target)[0].form.className;
			reqs = Meteor.user().profile.requests;
			request = reqs[reqno];
			acceptance = false;
			if($(e.target).prop("id") == "accept"){
				e.preventDefault();
				reqResStock = AllStocks.findOne({$and: [{gID: Meteor.user().profile.groupID}, {item: request["reqRes"]}]});
				if (reqResStock == undefined){
					Meteor.call('raiseAlert', Meteor.userId(), "Your group doesn't have the item you're trying to give! Trade fails");
					acceptance = false;
				}
				else if(reqResStock.amount < request["reqAmt"]){
					Meteor.call('raiseAlert', Meteor.userId(), "Your group doesn't have enough of the item you're trying to give! Trade fails");
					acceptance = false
				}
				else{
					Meteor.call('exchangeResources', request);
					Meteor.call('raiseAlert', Meteor.userId(), "Request completed, you have the things!");
					acceptance = true;
				}
				//***  add functions for making alerts, and send alert to requester about what happened ***//
			}
			else{
				e.preventDefault();
				acceptance = false;
				// console.log("reject", $(e.target).prop("fNo"));
			}

			if(acceptance == false){
				Meteor.call('raiseAlert', request["requester"], "Request rejected/failed.");
				// Meteor.call('raiseAlert', Meteor.userId(), "Request rejected/failed.");
			}
			else {
				Meteor.call('raiseAlert', request["requester"], "Request accepted! Woohoo");	
				// Meteor.call('raiseAlert', Meteor.userId(), "Request rejected/failed.");
			}
			request.replied = true;
			Meteor.users.update({_id: Meteor.userId()}, { $set: {"profile.requests": reqs} });

			// Meteor.users.update({_id: Meteor.userId()}, { $set: {"profile.requests": reqs.splice(reqno, 1)} });
		}
	});

	Template.stockInfo.helpers ({
		resources: function () {
			groupID = Meteor.user().profile.groupID;

			// return AllStocks.findOne({gID: groupID}).market;
			return AllStocks.find({gID: groupID});
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
			return Meteor.users.find({"profile.groupID": {$ne: Meteor.user().profile.groupID}}, {_id: 1});
		},

		givingResources: function () {
			// gr = []; 
			gr = AllStocks.find({$and: [{"gID": Meteor.user().profile.groupID}, {"amount": {$gt: 0}}] }, {"item": 1, "amount": 1});
			return gr;
		},

		allResources: function () {
			// ar = [];
			// ar = [{"name": "a"}, {"name": "b"}, {"name": "c"}, {"name": "d"}]
			ar = AllStocks.find({"amount": {$gt: 0}}, {"item": 1}).fetch();
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
				a = parseInt(AllStocks.find({$and: [{"gID": Meteor.user().profile.groupID}, {"item": res}, {"amount": {$gte: parseInt(amt)}}]}).fetch().length);
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

			// var alrts = Meteor.user().profile.alerts;
			// console.log(alrts, Meteor.user().profile.alerts);

			if (checkAvailability(event.target.GivingResource.value, event.target.giveAmount.value)){
				Meteor.call('reqTrade', event.target.Recipient.value, event.target.GivingResource.value, event.target.giveAmount.value, event.target.TakingResource.value, event.target.requestAmount.value);
				// alrts.push("Sent Request");
				Meteor.call('raiseAlert', Meteor.userId(), "Sent Request");
			}
			else{
				Meteor.call('raiseAlert', Meteor.userId(), "Request sending failed – probably not enough resource");
				// alrts.push("Request sending failed – probably not enough resource");
			}
			// Meteor.users.update({_id: Meteor.userId()}, {$set: {"profile.alerts": alrts}});
			
		}
	});

	Template.baseDash.helpers({
		adminGames() {
			return RunningGames.find({'admin': Meteor.userId()});
		},
		
		playingGames() {
			//look for query to search in arrays in a field in a mongo db
			return RunningGames.find({'users': Meteor.userId()});
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
			//use router to redirect to /games/<newGameCode>
			// Router.go("/games/" + newGameCode);
		},

		'submit .gameChoice': function(event) {
			event.preventDefault();
			gCode = event.target.gameCode.value;
			if (RunningGames.findOne({'accessCode': gCode}) != undefined){
				Meteor.call('joinGame', gCode, Meteor.userId());
			}
			Router.go("/games/" + gCode);
		}
	});

}


