RunningGames = new Mongo.Collection("games");
AllStocks = new Mongo.Collection("stocks");

Router.route('/', function() {
	this.render('Home');
});

Router.route('/games/:gameCode', function() {
	// console.log(this.params.gameCode);
	var gameCode = parseInt(this.params.gameCode);
	// console.log(gameCode);
	//check presence of user in game
		//if not, then redirect back to home, with alert "Not in game"
	role = "none";
	if (RunningGames.findOne({$and: [{"accessCode": gameCode}, {"admin": Meteor.userId()}] }) != undefined) {
		// console.log("found admin");
		role = "adminDash";
	}
	else if (RunningGames.findOne({$and: [{"accessCode": gameCode}, {"users": Meteor.userId()}]}) != undefined) {
		// console.log("found admin");
		role = "userDash";
	}
	else {
		// console.log("not found");
		Session.set("GameCode", 0);
		// alert("Not in that game!");
		// role = ""
		// Router.go("/");
	}
	if (role == "none"){
		alert("Not in this game");
		Router.go("/");
	}
	else{
		this.render(role, {
			data: {
				gameCode: this.gameCode
			}
		});
		Session.set("GameCode", gameCode);
	}
});
