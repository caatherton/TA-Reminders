
const moment = require('moment');

module.exports = {
	// server port
	PORT: 8080,

	// enable console logging (debug)
	LOGGING: true,

	// cron string specifying when to schedule notifications
	// This is every weekday at 1 AM
	SCHEDULER_CRON_STRING: '0 0 1 * * 1-5',

	// endpoint for retrieving today's letter / schedule info
	LETTER_DAY_ENDPOINT: 'http://day.cs.stab.org/infoToday',

	// email notifications schedule for a specific time of day
	STATIC_EMAIL_NOTS: [
		moment.utc('08:00:00', 'HH:mm:ss'),
		moment.utc('12:00:00', 'HH:mm:ss')
	],

	// SMS notifications scheduled for a specific time of day
	STATIC_SMS_NOTS: [
		moment.utc('08:45:00', 'HH:mm:ss'),
		moment.utc('10:00:00', 'HH:mm:ss'),
		moment.utc('12:00:00', 'HH:mm:ss'),
	],

	// email notifications occurring some duration BEFORE X Block
	PRE_X_EMAIL_NOTS: [
		moment.duration(60, 'minutes'),
		moment.duration(20, 'minutes')
	],

	// SMS notifications occurring some duration BEFORE X Block 
	PRE_X_SMS_NOTS: [
		moment.duration(30, 'minutes'),
		moment.duration(5, 'minutes'),
		moment.duration(0, 'minutes')
	]
}