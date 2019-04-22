
var express 			= require('express');
var app 				= express();
var mustacheExpress 	= require('mustache-express');
var bodyParser 			= require('body-parser');
var cookieParser 		= require('cookie-parser');
var session 			= require('cookie-session');
var passport 			= require('passport');
var creds				= require('./credentials.js');

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

var sys = require('./settings.js');
var auth = require('./auth.js').init(app, passport);

// send user's session info (for testing auth)
app.get('/test', auth.isAuthGET, function(req, res) {
	res.send(req.user || "There is no session for this user.");
});

// start server
var server = app.listen(sys.PORT, function() {
	console.log('TA Reminder Server listening on port %d', server.address().port);
});