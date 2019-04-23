
var moment = require('moment');
var request = require('request');
var schedule = require('node-schedule');
var con = require('./database.js').connection;
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

// schedule all notifications for today's TAs
function scheduleAllNotifications(cb) {
	// make request to letter day API to get letter and X Block time
	request(sys.LETTER_DAY_ENDPOINT, function(err, response, body) {
		// if no error making request
		if (!err) {
			// parse string to object
			var res = JSON.parse(body);

			// --------- debug -----------------------------------------
			res = {err: null, 
				data: {
					letter: 'B', 
					rotation: ['4', '5', '6'], 
					schedule: [
						{name: "X Block", start: "2019-04-22 13:35:00"}
						]
					}
				};
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
					// get notification times relative to X Block
					emailNotifs.push.apply(emailNotifs, parsePreXTimes(sys.PRE_X_EMAIL_NOTS, XBlock));
					smsNotifs.push.apply(smsNotifs, parsePreXTimes(sys.PRE_X_SMS_NOTS, XBlock));
				}

				// get letter day UID by name
				con.query('SELECT uid FROM letterDays WHERE name = ?;', [letter], function(err, rows) {
					if (!err && rows !== undefined && rows.length > 0) {
						var uid = rows[0].uid;

						// get all TAs who have hours today
						con.query('SELECT t.name, t.phone, t.email, t.uid FROM letterDayAssgn a JOIN TAs t ON a.taUID = t.uid WHERE letterUID = ?;', [uid], function(err, rows) {
							if (!err && rows !== undefined) {
								var ta;

								// construct TA objects
								for (var i = 0; i < rows.length; i++) {
									ta = new TA(rows[i].name, rows[i].phone, rows[i].email);

									for (var k = 0; k < emailNotifs.length; k++) {
										// schedule an email notification for this TA, at this time
										schedule.scheduleJob(emailNotifs[k].toDate(), ta.notifyEmail);
									}

									for (var k = 0; k < smsNotifs.length; k++) {
										// schedule an SMS notification for this TA, at this time
										schedule.scheduleJob(smsNotifs[k].toDate(), ta.notifySMS);
									}
								}

								// callback successfully
								cb();

							} else {
								cb(err || "Unable to determine which TA's have hours today");
							}
						});
					} else {
						cb(err || "Unable to determine today's letter day");
					}
				});
			} else {
				cb(res.err);
			}
		} else {
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




// // just testing it right now
// scheduleAllNotifications(function(err) {
// 	console.log(err);
// });