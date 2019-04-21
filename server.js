
// TA Class
function TA(_name, _phone, _email) {
	this.name = _name;
	this.phone = _phone;
	this.email = _email;

	// make name, phone, and email data accessible inside TA class methods
	var self = this;

	// notify this TA via SMS
	this.notifySMS = function() {
		console.log("Sending SMS to " + self.name + " at " + self.phone);
	}
}

// construct TA instances for the TAs on hours today
var Thomas = new TA('Thomas', '434-128-3933', 'thomas@gmail.com');
var Cole = new TA('Cole', '434-133-5555', 'cole@gmail.com');

// notice how Thomas.notifySMS uses Thomas' #, while Cole.notifySMS uses Cole's #
setTimeout(Thomas.notifySMS, 4000);	// notify Thomas after 4 seconds
setTimeout(Cole.notifySMS, 1000);	// notify Cole after 1 second