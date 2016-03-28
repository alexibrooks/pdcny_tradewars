// collection of everybody's markets
// each document is groupID, price of wood, graphite, and so on
// as well as 

// collection of Users has groupID information as well

// collection of all the groups' stocks

AllStocks = new Mongo.Collection("stocks");
// AllMarkets = new Mongo.Collection("markets");
groupIDs = ["g1", "g2", "g3", "g4"];
resources = ["a", "b", "c", "d"]

if (Meteor.isClient) {
	// counter starts at 0
	Session.setDefault('counter', 0);

	Template.body.helpers ({
		// stockInfo: function () {
		// 	groupID = Meteor.user().profile.groupID;
		// 	console.log(AllStocks.findOne({gID: groupID}));
		// 	return AllStocks.findOne({gID: groupID});
		// },

		userInfo: function () {
			return Meteor.user().profile.groupID;
		},

		uID: function () {
			return Meteor.userId();
		}
	});

	Template.stockInfo.helpers ({
		resources: function () {
			groupID = Meteor.user().profile.groupID;
			// console.log(AllStocks.findOne({gID: groupID}).prices);
			return AllStocks.findOne({gID: groupID}).market;
		}


	});

	Template.trade.helpers({
		otherUsers: function () {
			return Meteor.users.find({_id: {$ne: Meteor.userId()}}, {_id: 1});
		}
	});
	// Template.userInfo.helpers({
	// 	groupID: function () {
	// 		// console.log(Meteor.user().groupID);
	// 		return Meteor.user().profile.groupID;
	// 	}
	// });

	Template.hello.helpers({
		counter: function () {
			return Session.get('counter');
		}
	});

	Template.hello.events({
		'click button': function () {
			// increment the counter when button is clicked
			Session.set('counter', Session.get('counter') + 1);
			console.log(Meteor.user().profile);

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
		for (g in groupIDs){
			AllStocks.insert({
				gID : groupIDs[g],
				//name is name of resource, price is current price, stock is amount held
				market: [
					{"name": "a", "price": 100, "stock": 0}, 
					{"name": "b", "price": 100, "stock": 0}, 
					{"name": "c", "price": 10, "stock": 1000}, 
					{"name": "d", "price": 50, "stock": 100}
				]
				// stocks: [{"a" : 0}, {"b": 0}, {"c": 1000}, {"d": 100}],
				// "a" : {"stock": 0, "price": 100},
				// "b" : {"stock": 0, "price": 100},
				// "c" : {"stock": 1000, "price": 10},
				// "d" : {"stock": 100, "price": 50}
			});
			// AllMarkets.insert()
		}
		
	});

	Accounts.onCreateUser(function(options, user) {
		user.groupID = groupIDs[Math.floor(Math.random() * 4)];
		// We still want the default hook's 'profile' behavior.
		// console.log("User: ", user);
		if (options.profile == undefined) {
			options.profile = {"groupID": user.groupID};
		}
		else{
			options.profile["groupID"] = user.groupID;
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
