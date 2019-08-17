# TA-Reminders
A service to notify St. Anne's-Belfield CSTA's when their hours are occurring.

Created by Cole Atherton & Thomas Castleman

### Features

This service provides an interface through which TA's are able to view and update their individual hours schedules, while seeing the hours schedules of other TA's. The service then acts as a reminder system, sending both email and SMS notifications to TA's on days when their hours occur.

The system also allows administrators to modify the hours schedule of any TA, as well as manage the list of TA users, available letter days, and other administrators. Administrators provide the information necessary to contact TA's, and this is used to power the notification system.

### Notifications

The system provides both *static* and *relative* notifications, determined in the settings file. Static notifications occur at a specified time of day (i.e., 8:00 AM), regardless of the time at which TA Hours occur on that particular day. Relative notifications occur a specified amount of time *before* X Block (i.e. 30 min before), which thus depends on the schedule for that weekday.

*Note: Relative notifications are scheduled based on the assumption that TA Hours only occur during X Block.*

Every day, notifications are scheduled with the following process:
- establish today's letter day & daily schedule (using day.cs.stab.org, which runs [but-what-letter-day-is-it-really](https://github.com/thomascastleman/but-what-letter-day-is-it-really)) 
- determine the start time of X Block (for relative notifications)
- determine which TA's on this letter day
- schedule notifications for these TA's, at the specified static & relative times in `settings.js`

*Note: As the scheduler that schedules all notifications uses the system time, ensure the system timezone matches that of the location in which the service is to be used.*

#### SMS
SMS notifications are sent through [Twilio](https://www.twilio.com/), and thus require a Twilio account. 

Static SMS notifications are specified in the `STATIC_SMS_NOTS` field of `settings.js`, and relative SMS notifications likewise in the `PRE_X_SMS_NOTS` field.

#### Email
Email notifications are sent through [Mailgun](https://www.mailgun.com/), and require a domain that has certain mailing DNS records as specified by Mailgun's documentation. 

Static email notifications are specified in the `STATIC_EMAIL_NOTS` field of `settings.js`, and relative email notifications likewise in the `PRE_X_EMAIL_NOTS` field.

### API
The TA Hours API can be used to retrieve a plain object encoding the hours assignments. A GET request to `/api/assignments` will respond with an object of the following form:

```javascript
{  
   "err": null,
   "assignments":[  
      {  
         "letterUID":1,
         "letter":"A",
         "assignedTAs":[  
            {  
               "taUID":3,
               "letterUID":1,
               "name":"Cole Atherton",
               "type":"HDS"
            },
	    
	    ...
         ]
      },
      
      ...
   ]
}
```

The `assignments` field is an array of objects for each letter day, each of which has an `assignedTAs` field with the TA's on hours for that day.

### Testing

A script to generate test data is available by running `node testSuite.js`. This populates the database with fake TA profiles, fake admin profiles, and standard A-F letter days. It also randomly generates hours assignments for these fake profiles.

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
