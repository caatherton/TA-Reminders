
var db = require('./database.js');
var con = db.connection;
var auth = require('./auth.js');

module.exports = {
	init: function(app) {

		app.get('/', auth.isAuthGET, (req, res) => {
			var render = auth.defaultRender(req);

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
				res.send("non-admin");

			}
		});

		// admin portal
		app.get('/admin', auth.isAdminGET, (req, res) => {
			var render = auth.defaultRender(req);

			// get TA info
			db.getTAs(function(err, TAs) {
				if (!err) {
					// store TAs in render object
					render.TAs = TAs;
				}

				// get letter day info
				db.getLetterDays(function(err, letterDays) {
					if (!err) {
						// store letter days in render object
						render.letterDays = letterDays;
					}

					db.getAdmins(function(err, admins) {
						if (!err) {
							// store admin profiles info in render object
							render.admins = admins;
						}

						// render admin tools page
						res.render('admin.html', render);
					});
				});
			});
		});

		// create a new TA user profile
		app.post('/newTA', auth.isAdminPOST, (req, res) => {
			// add new TA
			db.addTA(req.body.name, req.body.phone, req.body.email, req.body.type, function(err) {
				if (!err) {
					// on success, redirect to admin portal
					res.redirect('/admin');
				} else {
					res.render('error.html', Object.assign(auth.defaultRender(req), {
						message: "Failed to add a new TA user: " + err
					}));
				}
			});
		});

		// endpoint for removing existing TA users
		app.post('/deleteTA', auth.isAdminPOST, (req, res) => {
			// remove TA from DB
			db.deleteTA(req.body.uid, function(err) {
				res.send({ err: err });
			});
		});

		// create a new letter day option
		app.post('/newLetterDay', auth.isAdminPOST, (req, res) => {
			// add letter day
			db.addLetterDay(req.body.letter, function(err) {
				if (!err) {
					// on succes, redirect to admin portal
					res.redirect('/admin');
				} else {
					res.render('error.html', Object.assign(auth.defaultRender(req), {
						message: "Failed to add new letter day: " + err
					}));
				}
			});
		});

		// endpoint for removing existing letter days
		app.post('/deleteLetterDay', auth.isAdminPOST, (req, res) => {
			// remove letter from DB
			db.deleteLetterDay(req.body.uid, function(err) {
				res.send({ err: err });
			});
		});

		// create new system administrator
		app.post('/newAdmin', auth.isAdminPOST, (req, res) => {
			// add admin profile
			db.addAdmin(req.body.name, req.body.email, function(err) {
				if (!err) {
					// on success, redirect to admin portal
					res.redirect('/admin');
				} else {
					res.render('error.html', Object.assign(auth.defaultRender(req), {
						message: "Failed to add new admin: " + err
					}));
				}
			});
		});

		// endpoint for removing existing administrators
		app.post('/deleteAdmin', auth.isAdminPOST, (req, res) => {
			// check that admin is not deleting themself
			if (req.body.uid != req.user.local.uid) {
				// remove admin from DB
				db.deleteAdmin(req.body.uid, function(err) {
					res.send({ err: err });
				});
			} else {
				res.send({ err: "You are unable to deauthorize yourself as an administrator." });
			}
		});

		// update the hours assignments
		app.post('/updateAssignments', auth.isAdminPOST, (req, res) => {
			// default to empty array (clearing assignments) if undefined
			req.body.assignments = req.body.assignments || [];

			// update assignments with those given
			db.updateAssignments(req.body.assignments, function(err) {
				res.send(err);
			});
		});


		return module.exports;
	}
}