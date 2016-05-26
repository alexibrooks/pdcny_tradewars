RunningGames = new Mongo.Collection("games");
AllStocks = new Mongo.Collection("stocks");
Alerts = new Mongo.Collection("alerts")
Events = new Mongo.Collection("eventlogs")

resources = ["a", "b", "c", "d"]
groupIDs = ["g1", "g2", "g3", "g4"];

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
			findUserGroup: function (userId, gameCode) {
				group = "none";
				if (RunningGames.findOne({$and: [{"gameCode": gameCode}, {"player": userId}]}) != undefined){
					group = RunningGames.findOne({$and: [{"gameCode": gameCode}, {"player": userId}]}).group;
				}
				return group;
			},

			reqTrade : function (gCode, recipient, requester, giveRes, giveAmt, takeRes, takeAmt) {
				// console.log(recipient, giveRes, giveAmt, takeRes, takeAmt);
				/*
				requests should look like:
				"user": requested
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
				// reqs = Meteor.users.findOne({_id: recipient}).profile.requests;
				reqLog = {"gameCode": gCode, "user": recipient, "requestedGroup": Meteor.call('findUserGroup', recipient, gCode) , "type": "request",  "contents": {"requester": {"id": requester, "username": Meteor.users.findOne({_id:requester}).username, "group": Meteor.call('findUserGroup', requester, gCode)}, "reqRes": takeRes, "reqAmt": parseInt(takeAmt), "recvRes": giveRes, "recvAmt": parseInt(giveAmt), "read": 0}};
				Alerts.insert(reqLog);
				console.log(reqLog);
				return reqLog;
				// reqs.push({"requester": Meteor.userId(), "reqRes": takeRes, "reqAmt": parseInt(takeAmt), "recvRes": giveRes, "recvAmt": parseInt(giveAmt), "reqNo": reqs.length, "replied": false});
				// Meteor.users.update({_id: recipient}, { $set: {"profile.requests": reqs} });
				// Meteor.users.findOne({_id: recipient}).profile.requests.push({"requester": Meteor.userId(), "reqRes": takeRes, "reqAmt": takeAmt, "recvRes": giveRes, "recvAmt": giveAmt});
			},

			raiseAlert: function (person, alert, gCode) {
				if (alert == "clearall") {
					Alerts.update({$and: [{"gameCode": gCode}, {"user": person}, {"type": "alert"}]}, {$set: {"contents.read": 1}}, {multi: true});
				}
				else {
					Alerts.insert({"gameCode": gCode, "user": person, "type": "alert", "contents": {"text": alert, "read": 0}});
				}
			},

			exchangeResources: function (reqId, gCode){
				// givingGrp = Meteor.users.findOne({"_id": request["requester"]}, {"profile": 1})
				// reqingGrp = "none";
				// recvGrp = "none";
				// Meteor.call('findUserGroup', Alerts.find({_id: reqId}).contents.requester.id, gCode, function (err, result){
				// 	if (err){reqingGrp = "none";}
				// 	else {
				// 		reqingGrp = result;
				// 	}
				// });
				// Meteor.call('findUserGroup', Meteor.userId(), gCode, function (err, result){
				// 	if (err){recvGrp = "none";}
				// 	else {recvGrp = result;}
				// });

				// reqingGrp = Meteor.users.findOne({"_id": request["requester"]}, {"profile": 1}).profile["groupID"];
				// recvGrp = Meteor.user().profile.groupID;
				recvGrp = Alerts.findOne({_id: reqId}).requestedGroup;
				request = Alerts.findOne({_id: reqId}).contents;
				reqingGrp = request.requester.group;
				// console.log(givingGrp, reqingGrp);

				finalRequesterRequestedStock = parseInt(AllStocks.findOne({$and: [{"gameCode": gCode}, {"gID": reqingGrp}, {"item": request["recvRes"]}]}).amount) - parseInt(request["recvAmt"]);
				finalReceiverRequestedStock = parseInt(AllStocks.findOne({$and: [{"gameCode": gCode}, {"gID": recvGrp}, {"item": request["recvRes"]}]}).amount) + parseInt(request["recvAmt"]);
				
				finalRequesterReceivedStock = parseInt(AllStocks.findOne({$and: [{"gameCode": gCode}, {"gID": reqingGrp}, {"item": request["reqRes"]}]}).amount) + parseInt(request["reqAmt"]);
				finalReceiverReceivedStock = parseInt(AllStocks.findOne({$and: [{"gameCode": gCode}, {"gID": recvGrp}, {"item": request["reqRes"]}]}).amount) - parseInt(request["reqAmt"]);

				AllStocks.update({$and: [{"gameCode": gCode}, {"gID": recvGrp}, {"item": request["recvRes"]}]}, {$set: {"amount": finalReceiverReceivedStock}});
				AllStocks.update({$and: [{"gameCode": gCode}, {"gID": recvGrp}, {"item": request["reqRes"]}]}, {$set: {"amount": finalReceiverRequestedStock}});
				AllStocks.update({$and: [{"gameCode": gCode}, {"gID": reqingGrp}, {"item": request["recvRes"]}]}, {$set: {"amount": finalRequesterReceivedStock}});
				AllStocks.update({$and: [{"gameCode": gCode}, {"gID": reqingGrp}, {"item": request["reqRes"]}]}, {$set: {"amount": finalRequesterRequestedStock}});

				// AllStocks.find({$and: [{"gameCode": gCode}, {"gID": recvGrp}, {"item": request["recvRes"]}]}).fetch();
				// AllStocks.find({$and: [{"gameCode": gCode}, {"gID": recvGrp}, {"item": request["reqRes"]}]}).fetch();
				// AllStocks.find({$and: [{"gameCode": gCode}, {"gID": reqingGrp}, {"item": request["recvRes"]}]}).fetch();
				// AllStocks.find({$and: [{"gameCode": gCode}, {"gID": reqingGrp}, {"item": request["reqRes"]}]}).fetch();

				Meteor.call('readRequest', reqId);
			},

			readRequest: function (reqId) {
				Alerts.update({_id: reqId}, {$set: {"contents.read": 1}});
			},

			makeNewGame: function (adminID, codeString = 1730) {
				//*** generate random 4 character string
				codeString = 1730;
				if (RunningGames.findOne({"gameCode": codeString}) == undefined){
					RunningGames.insert({
						"gameCode": codeString,
						"player": adminID,
						"playerName": Meteor.users.findOne({"_id": adminID}).username,
						"group": "admin"
					});
					Meteor.call("setupNewGameStocks", codeString);
				}
				else {
					//*** if this game already exists, generate a new codestring and try again
				}
				return codeString;
			},

			setupNewGameStocks: function (code) {
				for (g in groupIDs){
					// print("adding for ", groupIDs[g]);
					for (r in resources){
						// print("adding ", resources[r]);
						AllStocks.insert({
							"gameCode": code,
							"gID": groupIDs[g],
							"item": resources[r],
							"price": 150,
							"amount": 50
						});
					}
				}

			},

			joinGame: function (gameCode, joinerID) {
				// game = RunningGames.findOne({"gameCode": gameCode});
				// console.log(RunningGames.findOne({"gameCode": gameCode}));
				gameCode = parseInt(gameCode);
				if (RunningGames.findOne({"gameCode": gameCode}) == undefined) {
					console.log("undefined "+gameCode);
					return "Invalid game code";
				}
				else{
					// if (RunningGames.findOne({$and: [{"gameCode": gameCode}, {"users.id": joinerID}]}) == undefined && RunningGames.findOne({$and: [{"gameCode": gameCode}, {"admin": joinerID}]}) == undefined){
					// 	console.log("going to add this user");
					// 	RunningGames.update({"gameCode": gameCode}, {$addToSet: {"users": {"id": joinerID, "group": groupIDs[Math.floor(Math.random() * 4)]}}});
					// }
					game = RunningGames.findOne({$and: [{"gameCode": gameCode}, {"player": joinerID}]});
					grp = "home";
					// role = "userDash";
					if (game == undefined){
						grp = groupIDs[Math.floor(Math.random() * 4)];
						RunningGames.insert({
							"gameCode": gameCode,
							"player": joinerID,
							"playerName": Meteor.users.findOne({"_id": joinerID}).username,
							"group": grp
						});
					}
					else {
						grpNo = game.group;
						// if (grpNo == "admin"){
						// 	role = "adminDash";
						// }
					}
					// Session.set("GameCode", gameCode);
					// Session.set("GroupNo", grpNo);
					// Session.set("Role", role);

					return "Game joined";
					//*** redirect to url of game
				}
			}

		});
		
	});

	// Accounts.ui.config

	// Accounts.onCreateUser(function(options, user) {
	// 	user.groupID = groupIDs[Math.floor(Math.random() * 4)];
	// 	// We still want the default hook's 'profile' behavior.
	// 	// console.log("User: ", user);
	// 	if (options.profile == undefined) {
	// 		options.profile = {"groupID": user.groupID, "requests": [], "alerts": []};
	// 	}
	// 	else{
	// 		options.profile["groupID"] = user.groupID;
	// 		options.profile["requests"] = [];
	// 		options.profile["alerts"] = [];
	// 	}
	// 	// console.log("Options: ", options);
	// 	if (options.profile){
	// 		// console.log(user.groupID);
	// 		user.profile = options.profile;
	// 	}
	// 	// 	console.log(user.groupID);
	// 	return user;
	// });
}
