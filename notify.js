
var moment = require('moment');
var request = require('request');
var sys = require('./settings.js');

// TA Class
function TA(_name, _phone, _email) {
	// store name, phone & email
	this.name = _name;
	this.phone = _phone;
	this.email = _email;

	// make name, phone, and email data accessible inside TA class methods
	var self = this;

	// notify this TA via SMS
	this.notifySMS = function() {
		// placeholder SMS function
		console.log("Sending SMS to " + self.name + " at " + self.phone);
	}

	// notify this TA via email
	this.notifyEmail = function() {
		// placeholder email function
		console.log("Sending email to " + self.name + " at " + self.email);
	}
}

// // construct TA instances for the TAs on hours today
// var Thomas = new TA('Thomas', '434-128-3933', 'thomas@gmail.com');
// var Cole = new TA('Cole', '434-133-5555', 'cole@gmail.com');

// // // notice how Thomas.notifySMS uses Thomas' #, while Cole.notifySMS uses Cole's #
// setTimeout(Thomas.notifySMS, 4000);	// notify Thomas after 4 seconds
// setTimeout(Cole.notifySMS, 1000);	// notify Cole after 1 second



// schedule all notifications for today's TAs
function scheduleAllNotifications(cb) {
	// --------- debug --------------
	var XBlock = moment('2019-04-22 13:35:00');
	// ----------------------------------

	// make request to letter day API to get letter and X Block time
	request(sys.LETTER_DAY_ENDPOINT, function(err, response, body) {
		// if no error making request
		if (!err) {
			// parse string to object
			var res = JSON.parse(body);

			console.log(res.data);

			// if no letter day error
			if (!res.err) {

			} else {
				cb(res.err);
			}
		} else {
			cb(err);
		}
	});


	// get all email notification times for today
	var emailNotifs = parseStaticTimes(sys.STATIC_EMAIL_NOTS);
	emailNotifs.push.apply(emailNotifs, parsePreXTimes(sys.PRE_X_EMAIL_NOTS, XBlock));

	// get all SMS notification times for today
	var smsNotifs = parseStaticTimes(sys.STATIC_SMS_NOTS);
	smsNotifs.push.apply(smsNotifs, parsePreXTimes(sys.PRE_X_SMS_NOTS, XBlock));
}

// parse static notification times to be moment objects for today's date
function parseStaticTimes(times) {
	var notifTime, now;
	var result = [];

	// for each notification time
	for (var i = 0; i < times.length; i++) {
		notifTime = times[i];

		// get today's date, at time of notification
		now = moment().milliseconds(0);
		now.set({
			hours: notifTime.hour(),
			minutes: notifTime.minutes(),
			second: notifTime.seconds()
		});

		// add to list of notification times
		result.push(now);
	}

	return result;
}

// parse pre X duration objects into moment times relative to X Block time
function parsePreXTimes(durations, XTime) {
	var result = [];

	// for each duration
	for (var i = 0; i < durations.length; i++) {
		// subtract duration from X Block time to get scheduled notification time
		result.push(XTime.clone().subtract(durations[i]));
	}

	return result;
}


scheduleAllNotifications(function(err) {
	console.log(err);
});