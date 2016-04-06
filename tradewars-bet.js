// collection of everybody's markets
// each document is groupID, price of wood, graphite, and so on
// as well as 

// collection of Users has groupID information as well

// collection of all the groups' stocks

AllStocks = new Mongo.Collection("stocks");

// AllMarkets = new Mongo.Collection("markets");
groupIDs = ["g1", "g2", "g3", "g4"];
// resources = ["a", "b", "c", "d"]

if (Meteor.isClient) {
	// counter starts at 0
	Session.setDefault('counter', 0);

	Template.body.helpers ({
		userInfo: function () {
			return Meteor.user().profile.groupID;
		},

		uID: function () {
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

}

if (Meteor.isServer) {
	Meteor.startup(function () {
		// code to run on server at startup

		//given a list of resources, choose one at random
		//given a dict of resources : 0, make that random resource 1000

		//given a dict of resources and groupID , make a document with that groupID and dict

		//w
		// for (g in groupIDs){
		// 	console.log("adding for ", groupIDs[g]);
		// 	for (r in resources){
		// 		console.log("adding ", resources[r]);
		// 		AllStocks.insert({
		// 			"gID": groupIDs[g],
		// 			"item": resources[r],
		// 			"price": 150,
		// 			"amount": 50
		// 		});
		// 	}
		// }

		Meteor.methods({
			reqTrade : function (recipient, giveRes, giveAmt, takeRes, takeAmt) {
				console.log(recipient, giveRes, giveAmt, takeRes, takeAmt);
				/*
				requests should look like:
				[
					// {text: "blah blah"},
					{requester: },				requester
					{requested resource: },		reqRes
					{requested amount: },		reqAmt
					{receiving resource: },		recvRes
					{receiving amount: },		recvAmt
					{requestNumber: },			reqNo
					{replied: }					replied
				]
				*/
				reqs = Meteor.users.findOne({_id: recipient}).profile.requests;
				reqs.push({"requester": Meteor.userId(), "reqRes": takeRes, "reqAmt": parseInt(takeAmt), "recvRes": giveRes, "recvAmt": parseInt(giveAmt), "reqNo": reqs.length, "replied": false});
				Meteor.users.update({_id: recipient}, { $set: {"profile.requests": reqs} });

				// Meteor.users.findOne({_id: recipient}).profile.requests.push({"requester": Meteor.userId(), "reqRes": takeRes, "reqAmt": takeAmt, "recvRes": giveRes, "recvAmt": giveAmt});
			},

			raiseAlert: function (person, alert) {
				alert = {"text": alert};
				alrts = Meteor.users.findOne({_id: person}).profile.alerts;
				if (alert["text"] == "clearall") {
					alrts = [];
				}
				else {
					alrts.push(alert);
				}
				Meteor.users.update({_id: person}, { $set: {"profile.alerts": alrts} });
			},

			exchangeResources: function (request){
				// givingGrp = Meteor.users.findOne({"_id": request["requester"]}, {"profile": 1})
				reqingGrp = Meteor.users.findOne({"_id": request["requester"]}, {"profile": 1}).profile["groupID"];
				recvGrp = Meteor.user().profile.groupID;

				finalRequesterRequestedStock = parseInt(AllStocks.findOne({$and: [{"gID": reqingGrp}, {"item": request["recvRes"]}]}).amount) - parseInt(request["recvAmt"]);
				finalReceiverRequestedStock = parseInt(AllStocks.findOne({$and: [{"gID": recvGrp}, {"item": request["recvRes"]}]}).amount) + parseInt(request["recvAmt"]);
				
				finalRequesterReceivedStock = parseInt(AllStocks.findOne({$and: [{"gID": reqingGrp}, {"item": request["reqRes"]}]}).amount) + parseInt(request["reqAmt"]);
				finalReceiverReceivedStock = parseInt(AllStocks.findOne({$and: [{"gID": recvGrp}, {"item": request["reqRes"]}]}).amount) - parseInt(request["reqAmt"]);

				AllStocks.update({$and: [{"gID": recvGrp}, {"item": request["recvRes"]}]}, {$set: {"amount": finalReceiverReceivedStock}});
				AllStocks.update({$and: [{"gID": recvGrp}, {"item": request["reqRes"]}]}, {$set: {"amount": finalReceiverRequestedStock}});
				AllStocks.update({$and: [{"gID": reqingGrp}, {"item": request["recvRes"]}]}, {$set: {"amount": finalRequesterReceivedStock}});
				AllStocks.update({$and: [{"gID": reqingGrp}, {"item": request["reqRes"]}]}, {$set: {"amount": finalRequesterRequestedStock}});
			}

		});
		
	});

	Accounts.onCreateUser(function(options, user) {
		user.groupID = groupIDs[Math.floor(Math.random() * 4)];
		// We still want the default hook's 'profile' behavior.
		// console.log("User: ", user);
		if (options.profile == undefined) {
			options.profile = {"groupID": user.groupID, "requests": [], "alerts": []};
		}
		else{
			options.profile["groupID"] = user.groupID;
			options.profile["requests"] = [];
			options.profile["alerts"] = [];
		}
		// console.log("Options: ", options);
		if (options.profile){
			// console.log(user.groupID);
			user.profile = options.profile;
		}
		// 	console.log(user.groupID);
		return user;
	});
}
