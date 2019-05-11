
var creds = require('./credentials.js');
var moment = require('moment');
var request = require('request');
var schedule = require('node-schedule');
var con = require('./database.js').connection;
var sys = require('./settings.js');
var twilio = require('twilio')(creds.TWILIO_ACCOUNT_SID, creds.TWILIO_AUTH_TOKEN);
var nodemailer = require('nodemailer');

// create email-sender with nodemailer using Google OAuth2
var transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        type: 'OAuth2',
        user: creds.MAIL_ADDRESS,
        clientId: creds.MAIL_CLIENT_ID,
        clientSecret: creds.MAIL_CLIENT_SECRET,
        refreshToken: creds.MAIL_REFRESH_TOKEN,
        accessToken: creds.MAIL_ACCESS_TOKEN
    }
});

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
		// debug
		console.log("Sending SMS to " + self.name + " at " + self.phone);

		var message;

		// if we know when X Block is (we always should)
		if (self.xBlockTime) {
			// incorporate X Block time into message
			message = "Hey " + self.name + "! You have CSTA hours today at " + self.xBlockTime.format('h:mm A') + " (" + self.xBlockTime.fromNow() + ")";
		} else {
			// fallback on non-specific reminder message
			message = "Hey " + self.name + "! You have CSTA hours today!";
		}

		// use twilio to send to message to TA
		twilio.messages
			.create({
				body: message,
				to: self.phone,
				from: creds.TWILIO_NUMBER
			})
			.then(message => console.log(message.sid));
	}

	// notify this TA via email
	this.notifyEmail = function() {
		// debug
		console.log("Sending email to " + self.name + " at " + self.email);

		// format the X Block start time into a string
		var xTime = self.xBlockTime.format('h:mm A');

		// configure message settings / content
		var options = {
			to: self.email,
			from: creds.MAIL_ADDRESS,
			subject: "CSTA Hours Today! (" + xTime + ")",
			text: "Hey " + self.name + "!\n\nYou have hours today at " + xTime + " (" + self.xBlockTime.fromNow() + ").\n\nLove,\nCSTA Reminder Service";
			html: ""
		};

		// use nodemailer transporter to send email to TA
		transporter.sendMail(options);
	}
}

// schedule all notifications for today's TAs
function scheduleAllNotifications(cb) {
	// make request to letter day API to get letter and X Block time
	request(sys.LETTER_DAY_ENDPOINT, function(err, response, body) {
		// if no error making request
		if (!err) {
			// parse string to object
			var res = JSON.parse(body);

			// --------- debug -----------------------------------------
			// res = {err: null, 
			// 	data: {
			// 		letter: 'B', 
			// 		rotation: ['4', '5', '6'], 
			// 		schedule: [
			// 			{name: "X Block", start: "2019-04-22 13:35:00"}
			// 			]
			// 		}
			// 	};
			// -----------------------------------------------------------------

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
				}

				// get current letter day UID by name
				con.query('SELECT uid FROM letterDays WHERE name = ?;', [letter], function(err, rows) {
					if (!err && rows !== undefined && rows.length > 0) {
						var uid = rows[0].uid;

						// get all TAs who have hours today
						con.query('SELECT t.name, t.phone, t.email, t.uid FROM letterDayAssgn a JOIN TAs t ON a.taUID = t.uid WHERE letterUID = ?;', [uid], function(err, rows) {
							if (!err && rows !== undefined) {
								var ta;

								// construct TA object for each TA on hours today, use to schedule calls to notification functions
								for (var i = 0; i < rows.length; i++) {
									ta = new TA(rows[i].name, rows[i].phone, rows[i].email, XBlock);

									console.log("Scheduling notifications for " + ta.name + "...");

									// schedule an email notification for this TA at each specificed email notification time
									for (var k = 0; k < emailNotifs.length; k++) {
										schedule.scheduleJob(emailNotifs[k].toDate(), ta.notifyEmail);

										// debug: log message
										console.log("Scheduling email for " + ta.email + " at " + emailNotifs[k].format("YYYY-MM-DD hh:mm A"));
									}

									// schedule an SMS notification for this TA at each specified SMS notification time
									for (var k = 0; k < smsNotifs.length; k++) {
										schedule.scheduleJob(smsNotifs[k].toDate(), ta.notifySMS);

										// debug: log message
										console.log("Scheduling SMS for " + ta.phone + " at " + smsNotifs[k].format("YYYY-MM-DD hh:mm A"));
									}
								}

								// callback successfully
								cb();

							} else {
								// callback on error
								cb(err || "Unable to determine which TA's have hours today");
							}
						});
					} else {
						// callback on error
						cb(err || "Unable to determine today's letter day");
					}
				});
			} else {
				// callback on error
				cb(res.err);
			}
		} else {
			// callback on error
			cb(err);
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