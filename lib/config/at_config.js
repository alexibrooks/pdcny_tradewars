AccountsTemplates.configure({
	confirmPassword: false,
    overrideLoginErrors: false,
    lowercaseUsername: true,
    showForgotPasswordLink: true,
    homeRoutePath: '/'
});

if (Meteor.isServer){
    Meteor.methods({
        "userExists": function(username){
            return !!Meteor.users.findOne({username: username});
        },
    });
}


AccountsTemplates.addField({
    _id: 'name',
    type: 'text',
    displayName: "Full Name",
    // func: function(value){return value !== 'Full Name';},
    // errStr: 'Only "Full Name" allowed!',
});

AccountsTemplates.addField({
    _id: 'username',
    type: 'text',
    required: true,
    func: function(value){
        if (Meteor.isClient) {
            console.log("Validating username...");
            var self = this;
            Meteor.call("userExists", value, function(err, userExists){
                if (!userExists)
                    self.setSuccess();
                else
                    self.setError(userExists);
                self.setValidating(false);
            });
            return;
        }
        // Server
        return Meteor.call("userExists", value);
    },
});