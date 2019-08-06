# TA-Reminders
A service to notify St. Anne's-Belfield CSTAs when their hours are occurring.

### Credentials

The file `credentials.js` should take the following form:

```javascript
/*
	credentials.js: Private credentials used for authentication
*/

module.exports = {
	// session encryption secret
	SESSION_SECRET: '',

	// Google OAuth2 credentials for user authentication
	GOOGLE_CLIENT_ID: '',
	GOOGLE_CLIENT_SECRET: '',

	// Mailgun credentials
	MAILGUN_API_KEY: '',
	MAILGUN_DOMAIN: '',
	MAILGUN_FROM_ADDRESS: '',

	// Twilio credentials (SMS)
	TWILIO_ACCOUNT_SID: '',
	TWILIO_AUTH_TOKEN: '',
	TWILIO_NUMBER: '',

	// service domain
	DOMAIN: 'http://localhost:8080',

	// MySQL credentials
	MySQL_username: '',
	MySQL_password: ''
}
```
