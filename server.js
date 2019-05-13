
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
var routes = require('./routes.js').init(app);

app.get('*', (req, res) => {
	res.redirect('/');
});

// start server
var server = app.listen(sys.PORT, function() {
	console.log('CSTA Reminder Server listening on port %d', server.address().port);
});