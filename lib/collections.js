RunningGames = new Mongo.Collection("games");
AllStocks = new Mongo.Collection("stocks");
Alerts = new Mongo.Collection("alerts")
Events = new Mongo.Collection("eventlogs")

// setTimeout(setInterval(Meteor.call('checkLogins'), 120000), 7000);