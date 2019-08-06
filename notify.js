
var creds = require('./credentials.js');
var db = require('./database.js');
var con = db.connection;
var sys = require('./settings.js');
var moment = require('moment');
var request = require('request');
var schedule = require('node-schedule');
var twilio = require('twilio')(creds.TWILIO_ACCOUNT_SID, creds.TWILIO_AUTH_TOKEN);
var mailgun = require('mailgun-js')({ apiKey: creds.MAILGUN_API_KEY, domain: creds.MAILGUN_DOMAIN });

// generate a fun and exciting greeting, given a name
function greet(name) {
	// extract first name, to be casual and *cool*
	var spl = name.split(' ');
	name = spl.length > 0 ? spl[0] : name;

	// possible greetings
	var greetings = [
		"Hey %!",
		"Heyo %!",
		"What's up %!",
		"What's poppin' %!"
	];

	// choose a random greeting and fill in the name
	return greetings[Math.floor(Math.random() * greetings.length)].replace('%', name);
}

// generate a fun farewell message
function farewell() {
	// possible farewells
	var farewells = [
		"Love,",
		"Sincerely,",
		"Faithfully yours,",
		"With love,"
	];

	// choose random farewell
	return farewells[Math.floor(Math.random() * farewells.length)];
}

// TA Class
function TA(_name, _phone, _email, _XBlockTime) {
	// store name, phone & email
	this.name = _name;
	this.phone = _phone;
	this.email = _email;
	this.xBlockTime = _XBlockTime;

	// make name, phone, and email data accessible inside TA class methods
	var self = this;

	// notify this TA via SMS
	this.notifySMS = function() {
		// log SMS notification as it happens
		if (sys.LOGGING) console.log("Sending SMS to " + self.name + " at " + self.phone + " (" + moment().format('YYYY-MM-DD HH:mm:ss') + ")");

		// generate custom message for this TA
		var message = greet(self.name) + " You have CSTA hours today at " + self.xBlockTime.format('h:mm A') + " (" + self.xBlockTime.fromNow() + ")";

		// use twilio to send to message to TA
		twilio.messages
			.create({
				body: message,
				to: self.phone,
				from: creds.TWILIO_NUMBER
			})
	}

	// notify this TA via email
	this.notifyEmail = function() {
		// log email notification as it happens
		if (sys.LOGGING) console.log("Emailing " + self.name + " at " + self.email + " (" + moment().format('YYYY-MM-DD HH:mm:ss') + ")");

		// format the X Block start time into a string
		var xTime = self.xBlockTime.format('h:mm A');
		var xFromNow = self.xBlockTime.fromNow();

		// generate custom message for this TA
		var message = greet(self.name) + "<br><br>You have hours <strong>today at " + xTime + " (" + xFromNow + ")</strong>.<br><br>" + farewell() + "<br>CSTA Reminder Service";

		// configure message settings / content
		var options = {
			from: creds.MAILGUN_FROM_ADDRESS,
			to: self.email,
			subject: "CSTA Hours Today! (" + xTime + ")",
			text: message.replace(/<br>/g, '\n').replace(/<.+?>/g, ''),
			html: message
		};

		// send email
		mailgun.messages().send(options, (err, body) => {
			if (err) {
				if (sys.LOGGING) console.log("Failed to send email to \'" + self.email + "\': " + err);
			}
		});
	}
}

// schedule all notifications for today's TAs
function scheduleAllNotifications() {
	// make request to letter day API to get letter and X Block time
	request(sys.LETTER_DAY_ENDPOINT, function(err, response, body) {
		// if no error making request
		if (!err) {
			// parse string to object
			var res = JSON.parse(body);

			// if no letter day error
			if (!res.err) {
				// get letter and rotation info
				var letter = res.data.letter;
				var rotation = res.data.rotation;
				var XBlock;

				// if event schedule available
				if (res.data.schedule) {
					// find start time for X Block today
					for (var i = 0; i < res.data.schedule.length; i++) {
						// if X Block event found
						if (res.data.schedule[i].name == "X Block") {
							XBlock = moment(res.data.schedule[i].start);
							break;
						}
					}
				}

				// get static email & SMS notification times for today
				var emailNotifs = parseStaticTimes(sys.STATIC_EMAIL_NOTS);
				var smsNotifs = parseStaticTimes(sys.STATIC_SMS_NOTS);

				// if X Block time successfully found & parsed
				if (XBlock && XBlock.isValid()) {
					// get notification times relative to X Block, add to total notifications
					emailNotifs.push.apply(emailNotifs, parsePreXTimes(sys.PRE_X_EMAIL_NOTS, XBlock));
					smsNotifs.push.apply(smsNotifs, parsePreXTimes(sys.PRE_X_SMS_NOTS, XBlock));

					// get current letter day UID by name
					db.getLetterUIDByLetter(letter, function(err, uid) {
						if (!err) {
							// get all TAs who have hours today
							db.getTAsAssignedToLetter(uid, function(err, assignedTAs) {
								if (!err) {
									var ta;

									// construct TA object for each TA on hours today, use to schedule calls to notification functions
									for (var i = 0; i < assignedTAs.length; i++) {
										// construct new TA object, to have access to functions that will use this TA's contacts
										ta = new TA(assignedTAs[i].name, assignedTAs[i].phone, assignedTAs[i].email, XBlock);

										// log who we're scheduling for
										if (sys.LOGGING) console.log("Scheduling notifications for " + ta.name + " (" + assignedTAs[i].uid + ")...");

										// schedule an email notification for this TA at each specificed email notification time
										for (var k = 0; k < emailNotifs.length; k++) {
											schedule.scheduleJob(emailNotifs[k].toDate(), ta.notifyEmail);

											// log email scheduling
											if (sys.LOGGING) console.log("Scheduling email for " + ta.email + " at " + emailNotifs[k].format("YYYY-MM-DD hh:mm A"));
										}

										// schedule an SMS notification for this TA at each specified SMS notification time
										for (var k = 0; k < smsNotifs.length; k++) {
											schedule.scheduleJob(smsNotifs[k].toDate(), ta.notifySMS);

											// log SMS scheduling
											if (sys.LOGGING) console.log("Scheduling SMS for " + ta.phone + " at " + smsNotifs[k].format("YYYY-MM-DD hh:mm A"));
										}
									}
								} else {
									// log error
									console.log(err || "Unable to determine which TA's have hours today");
								}
							});
						} else {
							// log error
							console.log(err || "Unable to determine today's letter day");
						}
					});
				}
			} else {
				// log error
				console.log(res.err);
			}
		} else {
			// log error
			console.log(err);
		}
	});
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

// every weekday at 1 AM, schedule all notifications for the day
schedule.scheduleJob('0 0 1 * * 1-5', scheduleAllNotifications);