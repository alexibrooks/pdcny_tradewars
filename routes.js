// RunningGames = new Mongo.Collection("games");
// AllStocks = new Mongo.Collection("stocks");

// import { RunningGames } from './server.js';

Router.route('/', function() {
	this.render('Home');
	Session.set("GameCode", 0);
	Session.set("GroupNo", "home");
	// console.log(RunningGames.findOne());
	// console.log(Meteor.users.findOne());
	// console.log(AllStocks.findOne());
});

Router.route('/games/:gameCode', 
	function () {
	// waitOn: function () {
		setSession = function (gCode, group, role) {
			Session.set("GameCode", gCode);
			Session.set("GroupNo", group);
			Session.set("Role", role);
			// console.log("session setting");
		}
		var gameCode = parseInt(this.params.gameCode);
		role = "none";
		group = "none";
		//is this user an admin
		game = RunningGames.findOne({$and: [{"gameCode": gameCode}, {"player": Meteor.userId()}] });
		if (game != undefined) {
			group = game.group;
			console.log(group);
			if (group == "admin"){
				role = "adminDash";
			}
			else {
				role = "userDash";
			}
			setSession(gameCode, group, role);
		}
		else {
			// console.log("nothing found");
			gameCode = 0;
		}
		// this.next();
	// },


	// action: function () {
		// if (Session.get("Ready") == 1){
			if (Session.get("GameCode") == 0) {
				// alert("Not in this game");
				Router.go("/");
			}
			
			else {
				console.log(Session.get("Role"));
				this.render(Session.get("Role"));
			}
		// }
	// }
});
