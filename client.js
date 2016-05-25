// RunningGames = Mongo.Collection("games");
// AllStocks = Mongo.Collection("stocks");
// Alerts = Mongo.Collection("alerts")
// import { RunningGames } from './server.js';
// import { AllStocks } from './server.js';
// import { Alerts } from './server.js';


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
			// grp = "None";
			// Meteor.call("findUserGroup", Meteor.userId(), Session.get("GameCode"), function (error, result) {
			// 	if (!error) {
			// 		// console.log(result);
			// 		// console.log(grp);
			// 		// grp = result;
			// 		Session.set("GroupNo", result);
			// 		// console.log(grp);
			// 		// return grp;
			// 	}
			// });
			// return RunningGames.findOne({$and: [{accessCode: Session.get("GameCode")}, {users.id: Meteor.userId()}]}).users.group;
			// while (grp == "None"){
			// 	console.log(grp);
			
			return Session.get("GroupNo");
		},

		userID: function () {
			return Meteor.user().username;
		}
	});

	Template.alertsTemp.helpers({
		allAlerts: function () {
			// return Meteor.user().profile.alerts;
			// console.log("Ale");
			// console.log(Alerts.find({$and: [{"gameCode": Session.get("GameCode")}, {"user": Meteor.userId()}, {type: "alert"}, {"contents.read": 0}]}).fetch()[0].contents.text);
			return Alerts.find({$and: [{"gameCode": Session.get("GameCode")}, {"user": Meteor.userId()}, {type: "alert"}, {"contents.read": 0}]});
		}
	});

	Template.alertsTemp.events({
		'submit .clear-alerts' : function (event) {
			event.preventDefault();
			// console.log(Meteor.user().profile.alerts)
			// Meteor.users.update({_id: Meteor.userId()}, {$set: {"profile.alerts": []}});
			Meteor.call('raiseAlert', Meteor.userId(), "clearall", Session.get("GameCode"));
		}
	});

	Template.requestsTemp.helpers({
		allRequests: function () {
			// console.log("reqs");
			// if (Meteor.user().profile.requests != undefined)

			// return Meteor.user().profile.requests.filter(function (x) { return x["replied"] == false; });
			// returnReqs = [];
			return Alerts.find({$and: [{gameCode: Session.get("GameCode")}, {user: Meteor.userId()}, {type: "request"}, {"contents.read": 0}]});
			// Meteor.call('
		}
	});

	Template.requestsTemp.events({
		"click input[type=submit]": function(e) {
			reqId = $(e.target)[0].form.className;
			// reqs = Meteor.user().profile.requests;
			// reqLog = Alerts.findOne({_id: reqId});
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
				//***  add functions for making alerts, and send alert to requester about what happened ***//
			}
			else{
				// console.log("reject");
				e.preventDefault();
				acceptance = false;
				// console.log("reject", $(e.target).prop("fNo"));
			}

			if(acceptance == false){
				Meteor.call('raiseAlert', request["requester"].id, "Request rejected/failed.", Session.get("GameCode"));
				// Meteor.call('raiseAlert', Meteor.userId(), "Request rejected/failed.");
			}
			else {
				Meteor.call('raiseAlert', request["requester"].id, "Request accepted! Woohoo", Session.get("GameCode"));	
				// Meteor.call('raiseAlert', Meteor.userId(), "Request rejected/failed.");
			}
			Meteor.call('readRequest', reqId);
			
			// request.replied = true;
			// Meteor.users.update({_id: Meteor.userId()}, { $set: {"profile.requests": reqs} });

			// Meteor.users.update({_id: Meteor.userId()}, { $set: {"profile.requests": reqs.splice(reqno, 1)} });
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
			// return Meteor.users.find({"profile.groupID": {$ne: Meteor.user().profile.groupID}}, {_id: 1});
			gamePlayers = RunningGames.findOne({$and: [{gameCode: Session.get("GameCode")}, {"users.id": Meteor.userId()}]}).users;
			others = [];
			// console.log(users);
			for (u in gamePlayers){
				if (gamePlayers[u].id != Meteor.userId()) {
					others.push(gamePlayers[u].id);
				}
			}
			return Meteor.users.find({_id: {$in: others}});
		},

		givingResources: function () {
			return AllStocks.find({$and: [{"gameCode": Session.get("GameCode")}, {"gID": Session.get("GroupNo")}, {"amount": {$gt: 0}}] }, {"item": 1, "amount": 1});
		},

		allResources: function () {
			// ar = [];
			// ar = [{"name": "a"}, {"name": "b"}, {"name": "c"}, {"name": "d"}]
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

			// var alrts = Meteor.user().profile.alerts;
			// console.log(alrts, Meteor.user().profile.alerts);

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
				// alrts.push("Sent Request");
			}
			else{
				Meteor.call('raiseAlert', Meteor.userId(), "Request sending failed – probably not enough resource", Session.get("GameCode"));
				// alrts.push("Request sending failed – probably not enough resource");
			}
			// Meteor.users.update({_id: Meteor.userId()}, {$set: {"profile.alerts": alrts}});
			
		}
	});

	Template.baseDash.helpers({
		adminGames() {
			// console.log(RunningGames.find({'admin': Meteor.userId()}).fetch());
			return RunningGames.find({'admin': Meteor.userId()});
		},
		
		playingGames() {
			//look for query to search in arrays in a field in a mongo db
			return RunningGames.find({'users.id': Meteor.userId()});
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
			// game = RunningGames.findOne({'accessCode': gCode});
			// if (game != undefined){
			// console.log(gCode);
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


