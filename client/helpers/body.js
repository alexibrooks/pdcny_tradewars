Template.body.helpers ({
	username: function () {
		return Meteor.user().username;
	}
});

Template.body.events ({
	'click .logOut': function () {
		// console.log("logging out?");
		AccountsTemplates.logout();
		Router.go('/');
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

