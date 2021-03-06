const creds = require('./credentials.js');
const mysql = require('mysql');

// establish MySQL connection
const con = mysql.createPool({
	host: 'localhost',
	user: creds.MySQL_username,
	password: creds.MySQL_password,
	database: 'taReminders'
});

module.exports = {
	// export connection
	connection: con,

	// get all existing letter days
	getLetterDays: function(cb) {
		// query letter days table
		con.query('SELECT * FROM letterDays;', function(err, rows) {
			if (!err && rows !== undefined) {
				cb(err, rows);
			} else {
				cb(err || "Unable to find letter day records");
			}
		});
	},

	// get all TA user info
	getTAs: function(cb) {
		// query TAs table
		con.query('SELECT * FROM TAs;', function(err, rows) {
			if (!err && rows !== undefined) {
				cb(err, rows);
			} else {
				cb(err || "Unable to find TA records");
			}
		});
	},

	// get TA hours assignments
	getAssignments: function(cb) {
		// get all letter day info
		con.query('SELECT * FROM letterDays;', function(err, rows) {
			if (!err && rows !== undefined && rows.length > 0) {

				var days = {};

				// construct an object for each letter day
				for (var i = 0; i < rows.length; i++) {
					days[rows[i].uid] = {
						letterUID: rows[i].uid,
						letter: rows[i].name,
						assignedTAs: []
					};
				}

				// get hours assignments, with TA uid, name, and type
				con.query('SELECT a.taUID, a.letterUID, t.name, t.type FROM letterDayAssgn a JOIN TAs t ON a.taUID = t.uid;', function(err, rows) {
					if (!err && rows !== undefined) {
						// add each TA to their assigned letter day(s)
						for (var i = 0; i < rows.length; i++) {
							days[rows[i].letterUID].assignedTAs.push(rows[i]);
						}

						// convert hashmap to array of day objects
						var result = [];
						for (var uid in days) {
							if (days.hasOwnProperty(uid)) {
								result.push(days[uid]);
							}
						}

						// callback on letter day objects
						cb(err, result);
					} else {
						cb(err || "Unable to retrieve assignment records.");
					}
				});

			} else {
				cb(err || "There are no letter days with which to create assignments.");
			}
		});
	},

	// get all admin user info
	getAdmins: function(cb) {
		// query admins table
		con.query('SELECT * FROM admins;', function(err, rows) {
			if (!err && rows !== undefined) {
				cb(err, rows);
			} else {
				cb(err || "Unable to find admin records");
			}
		});
	},

	// remove and replace all hours assignments with new updates
	updateAssignments: function(assignments, cb) {
		// ensure assignments exist (can be empty)
		if (assignments) {
			// clear out existing assignments
			con.query('DELETE FROM letterDayAssgn;', function(err) {
				if (!err) {
					// if there are assignments to insert
					if (assignments.length > 0) {
						// insert fresh assignments into table
						con.query('INSERT INTO letterDayAssgn (taUID, letterUID) VALUES ?;', [assignments], function(err) {
							cb(err);
						});
					} else {
						cb();
					}
				} else {
					cb(err);
				}
			});
		} else {
			cb("Unable to update hours assignments, as no new assignments were given.")
		}
	},

	// update the hours assignments of an individual TA, without affecting anyone else's hours
	updateIndivAssignments: function(taUID, assignments, cb) {
		// clear assignments table of all records pertaining to this TA
		con.query('DELETE FROM letterDayAssgn WHERE taUID = ?;', [taUID], function(err) {
			if (!err) {
				// if there are new assignments to add (could be empty)
				if (assignments.length > 0) {
					// insert the updated assignment records for this TA
					con.query('INSERT INTO letterDayAssgn (taUID, letterUID) VALUES ?;', [assignments], function(err) {
						cb(err);
					});
				} else {
					cb();
				}
			} else {
				cb(err);
			}
		});
	},

	// add a new TA user
	addTA: function(name, phone, email, type, cb) {
		// ensure fields are defined
		if (name && phone && email && type) {
			// insert new record into TAs table
			con.query('INSERT INTO TAs (name, phone, email, type) VALUES (?, ?, ?, ?);', [name, phone, email, type], function(err) {
				cb(err);
			});
		} else {
			cb("The system failed to add the TA as not all fields are filled in.");
		}
	},

	// retrieve a singular TA by UID
	getTA: function(uid, cb) {
		if (uid) {
			// select TA info from table
			con.query('SELECT * FROM TAs WHERE uid = ?;', [uid], function(err, rows) {
				if (!err && rows !== undefined && rows.length > 0) {
					cb(err, rows[0]);
				} else {
					cb(err || ("Failed to retrieve the TA associated with this identifier: " + uid));
				}
			});
		} else {
			cb("Invalid identifier provided, unable to retrieve TA information.");
		}
	},

	// remove an existing TA by UID
	deleteTA: function(uid, cb) {
		// ensure UID is defined
		if (uid) {
			// query TA table
			con.query('DELETE FROM TAs WHERE uid = ?;', [uid], function(err) {
				cb(err);
			});
		} else {
			cb("Unable to delete TA as no UID has been provided.");
		}
	},

	// edit fields of an existing TA
	editTA: function(uid, name, phone, email, type, cb) {
		if (uid && email) {

			// reset empty non-required fields to null
			if (name == '') name = null;
			if (phone == '') phone = null;
			if (type == '') type = null;

			con.query('UPDATE TAs SET name = ?, phone = ?, email = ?, type = ? WHERE uid = ?;', [name, phone, email, type, uid], cb);
		} else {
			cb("Unable to edit TA as either identifier or email was not provided");
		}
	},

	// add a new letter day
	addLetterDay: function(letter, cb) {
		// ensure letter is defined
		if (letter) {
			// insert new record into letter days table
			con.query('INSERT INTO letterDays (name) VALUES (?);', [letter], function(err) {
				cb(err);
			});
		} else {
			cb("The system failed to add the letter day as not all fields are filled in.");
		}
	},

	// delete an existing letter day by UID
	deleteLetterDay: function(uid, cb) {
		// ensure UID is defined
		if (uid) {
			// query letter day table
			con.query('DELETE FROM letterDays WHERE uid = ?;', [uid], function(err) {
				cb(err);
			});
		} else {
			cb("Unable to delete letter day as no UID has been provided.");
		}
	},

	// add an admin user account
	addAdmin: function(name, email, cb) {
		// ensure fields are defined
		if (name && email) {
			// insert new record into admins table
			con.query('INSERT INTO admins (name, email) VALUES (?, ?);', [name, email], function(err) {
				cb(err);
			});
		} else {
			cb("The system failed to add the administrator as not all fields are filled in.");
		}
	},

	// delete an existing admin user account by UID
	deleteAdmin: function(uid, cb) {
		// ensure UID is defined
		if (uid) {
			// query admin table
			con.query('DELETE FROM admins WHERE uid = ?;', [uid], function(err) {
				cb(err);
			});
		} else {
			cb("Unable to delete admin as no UID has been provided.");
		}
	},

	// get the UID of a letter day by its letter value
	getLetterUIDByLetter: function(letter, cb) {
		// select UID from letterDays table
		con.query('SELECT uid FROM letterDays WHERE name = ?;', [letter], function(err, rows) {
			if (!err && rows !== undefined && rows.length > 0) {
				// callback on UID
				cb(err, rows[0].uid);
			} else {
				// callback on error
				cb(err);
			}
		});
	},

	// get all TA profiles who are assigned to a given letter day
	getTAsAssignedToLetter: function(letterUID, cb) {
		// join TAs to letter day assignments table
		con.query('SELECT t.name, t.phone, t.email, t.uid FROM letterDayAssgn a JOIN TAs t ON a.taUID = t.uid WHERE letterUID = ?;', [letterUID], function(err, rows) {
			if (!err && rows !== undefined) {
				cb(err, rows);
			} else {
				cb(err);
			}
		});
	}
}