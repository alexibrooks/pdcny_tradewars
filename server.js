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
			},

			makeNewGame: function (adminID, codeString = 1730) {
				//generate random 4 character string
				codeString = 1730;
				if (RunningGames.findOne({"accessCode": codeString}) == undefined){
					RunningGames.insert({
						"accessCode": codeString,
						"admin": adminID,
						"users": []
					});
				}
				return codeString;
			},

			joinGame: function (gameCode, joinerID) {
				game = RunningGames.findOne({"accessCode": gameCode});
				if (game == undefined) {
					return "Invalid game code";
				}
				else{
					if (RunningGames.findOne({$and: [{"accessCode": gameCode}, {"users.id": joinerID}]}) == undefined){
						RunningGames.update({"accessCode": gameCode}, {$addToSet: {"users": {"id": joinerID, "group": groupIDs[Math.floor(Math.random() * 4)]}}});
					}
					//redirect to url of game
				}
			},

			getGameDocument(code, uid) {
				return RunningGames.findOne({$and: [{"accessCode": code}, {"users.id": uid}]});
			}

		});
		
	});

	// Accounts.ui.config

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
