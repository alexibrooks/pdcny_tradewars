Spammy Queries

// us = ["Sit3k7DZdPQs24shx", "QsgMNhnLDPZPRSyAh", "CEiRrYbFaECEzXdTQ", "4ELpfrYfwex6DoEfD"]
// for (u in us){
// 	db.users.update({"_id": us[u]}, {$set: {"profile.alerts": []}})
// }

// db.users.update({}, {$set: {"profile.alerts": []}});

resources = ["a", "b", "c", "d"]
groupIDs = ["g1", "g2", "g3", "g4"];
for (g in groupIDs){
	print("adding for ", groupIDs[g]);
	for (r in resources){
		print("adding ", resources[r]);
		AllStocks.insert({
			"gID": groupIDs[g],
			"item": resources[r],
			"price": 150,
			"amount": 50
		});
	}
}

// db.AllStocks.find({})

// while(All)

