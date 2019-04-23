
var moment = require('moment');

module.exports = {
	// server port
	PORT: 8080,

	// endpoint for retrieving today's letter / schedule info
	LETTER_DAY_ENDPOINT: 'http://day.cs.stab.org/infoToday',

	// email notifications schedule for a specific time of day
	STATIC_EMAIL_NOTS: [
		moment.utc('08:00:00', 'HH:mm:ss'),
		moment.utc('10:53:20', 'HH:mm:ss')
	],

	// SMS notifications scheduled for a specific time of day
	STATIC_SMS_NOTS: [
		moment.utc('08:45:00', 'HH:mm:ss'),
		moment.utc('10:00:00', 'HH:mm:ss'),
		moment.utc('12:45:00', 'HH:mm:ss'),
	],

	// email notifications occurring some duration BEFORE X Block
	PRE_X_EMAIL_NOTS: [
		moment.duration(60, 'minutes'),
		moment.duration(20, 'minutes')
	],

	// SMS notifications occurring some duration BEFORE X Block 
	PRE_X_SMS_NOTS: [
		moment.duration(5, 'minutes'),
		moment.duration(0, 'minutes')
	]
}