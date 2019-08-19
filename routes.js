
const db = require('./database.js');
const con = db.connection;
const auth = require('./auth.js');

module.exports = {
	init: function(app) {

		// render calendar interface for editing hours assignments for either admin or TA
		app.get('/', (req, res) => {
			var render = auth.defaultRender(req);

			// get hours assignments
			db.getAssignments(function(err, assgn) {
				if (!err) {
					// store assignments in render obj
					render.days = assgn;

					// get TA profiles
					db.getTAs(function(err, TAs) {
						if (!err) {
							// store profiles in render obj
							render.TAs = TAs;

							// if authenticated user, render a scheduler page
							if (req.isAuthenticated() && req.user.local) {
								// render admin interface for admins
								if (req.user.local.isAdmin) {
									// render calendar interface
									res.render('adminScheduler.html', render);
								} else {
									// store this TA's system info in render object
									render.user = req.user.local;

									// render hours scheduler for TAs
									res.render('TAScheduler.html', render);
								}
							} else {
								// render hours schedule viewer for unauth'd users
								res.render('scheduleView.html', render);
							}
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
		});

		// show admin portal
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
						message: err
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
						message: err
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
						message: err
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

		// update the hours assignments of a given TA
		app.post('/updateIndivAssignments', auth.isAuthPOST, (req, res) => {
			// parse body
			var assgn = req.body.assignments || [], toApply = [];
			var taUID = req.user.local.uid;

			// filter out any assignments that do not involve this TA
			for (var i = 0; i < assgn.length; i++) {
				if (assgn[i].length == 2 && assgn[i][0] == taUID && assgn[i][1] > 0) {
					toApply.push(assgn[i]);
				}
			}

			// apply updates to this TA's assignments
			db.updateIndivAssignments(taUID, toApply, function(err) {
				// respond with error, if any
				res.send(err);
			});
		});

		// get object serialization of current hours assignments
		app.get('/api/assignments', (req, res) => {
			db.getAssignments(function(err, assgn) {
				// send data & potentially, error
				res.send({ err: err, assignments: assgn });
			});
		});

		return module.exports;
	}
}