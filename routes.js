
var db = require('./database.js');
var con = db.connection;
var auth = require('./auth.js');

module.exports = {
	init: function(app) {

		app.get('/', auth.isAuthGET, (req, res) => {
			var render = {};

			// if user is admin
			if (req.user.local.isAdmin) {
				// get hours assignments
				db.getAssignments(function(err, assgn) {
					if (!err) {
						render.days = assgn;

						// get TA profiles
						db.getTAs(function(err, TAs) {
							if (!err) {
								render.TAs = TAs;

								// render calendar interface
								res.render('ui.html', render);
							} else {
								// render error
								res.render('error.html', {
									message: "The system was unable to retrieve profile information for all TAs."
								});
							}
						});
					} else {
						// render error
						res.render('error.html', {
							message: "The system was unable to retrieve the hours assignments from the database."
						});
					}
				});
			} else {

				// handle for non-admins here

			}
		});

		// admin portal
		app.get('/admin', auth.isAdminGET, (req, res) => {

		});

		return module.exports;
	}
}