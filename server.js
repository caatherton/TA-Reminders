
const express 			= require('express');
const app 				= express();
const mustacheExpress 	= require('mustache-express');
const bodyParser 			= require('body-parser');
const cookieParser 		= require('cookie-parser');
const session 			= require('cookie-session');
const passport 			= require('passport');
const creds				= require('./credentials.js');

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.engine('html', mustacheExpress());
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/views'));

// configure session
app.use(session({ 
	secret: creds.SESSION_SECRET,
	name: 'session',
	resave: true,
	saveUninitialized: true
}));

const sys = require('./settings.js');						// include system settings
const auth = require('./auth.js').init(app, passport);	// initialize authentication system
const routes = require('./routes.js').init(app);			// initialize application routes
const notify = require('./notify.js');					// set up notification system

app.get('*', (req, res) => {
	res.redirect('/');
});

// start server
const server = app.listen(sys.PORT, function() {
	console.log('CSTA Reminder Server listening on port %d', server.address().port);
});