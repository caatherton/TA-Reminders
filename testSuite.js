
var con = require('./database.js').connection;

const NUM_TAS = 10;
const NUM_ADMINS = 3;
const NUM_LETTER_DAYS = 6;
const TAS_PER_LETTER_DAY = Math.floor(NUM_TAS / NUM_LETTER_DAYS);

if (TAS_PER_LETTER_DAY < 1) {
	throw new Error("Unable to generate test data: Number of letter days exceeds number of TAs.");
}

// list of names
var names = ["Tierra Yuan","Bryanna Polite","Bonita Trostle","Maile Stokley","Johnathan Matas","Marjory Herron","Ronda Billips","Kristofer Twigg","Britta Broman","Valencia Bergin","Giovanna Meador","Nanette Sneed","Teddy Presutti","Eileen Prowse","Adeline Olivier","Rosena Leclair","Melva Briceno","Magan Crosson","Audry Nish","Ernesto Breeden","Wesley Massingale","Lillian Blind","Monte Nylander","Bart Lockamy","Stacia Edney","Hae Hawks","Naomi Payne","Willy Scales","Pearlene Remer","Katrice Curl"];

// list of phones
var phones = ["(314) 331-9607","(849) 307-9575","(244) 250-6127","(339) 933-9902","(384) 681-2065","(856) 875-5593","(475) 591-6404","(371) 244-5558","(222) 740-0595","(592) 831-4374","(461) 693-5147","(464) 620-0670","(678) 507-5114","(844) 760-2689","(336) 576-0246","(459) 538-4645","(797) 474-5248","(631) 429-5204","(337) 212-2919","(848) 249-7350","(607) 606-7362","(340) 827-8097","(713) 513-9662","(533) 574-6413","(723) 621-8618","(481) 482-8197","(687) 973-2137","(252) 458-9741","(799) 436-3490","(952) 913-7721","(393) 606-9299","(769) 641-8132","(761) 870-0590","(302) 871-5272","(637) 936-3518","(370) 773-2641","(708) 455-3577","(399) 359-5369","(962) 992-7174","(349) 423-7018"];

// list of emails
var emails = ["kevinm@optonline.net","boftx@hotmail.com","mhassel@att.net","neonatus@me.com","carmena@outlook.com","jeffcovey@yahoo.ca","chrisk@aol.com","mnemonic@mac.com","nelson@att.net","amimojo@outlook.com","kostas@yahoo.ca","syrinx@aol.com","mcrawfor@hotmail.com","studyabr@icloud.com","ninenine@mac.com","lpalmer@att.net","thurston@verizon.net","drewf@optonline.net","geoffr@verizon.net","euice@sbcglobal.net","helger@verizon.net","lamky@yahoo.ca","dmouse@yahoo.ca","codex@icloud.com","hllam@yahoo.com","kingma@outlook.com","storerm@yahoo.com","samavati@me.com","bester@icloud.com","vganesh@yahoo.com","mmccool@msn.com","jonathan@mac.com","majordick@gmail.com","mgreen@yahoo.com","gospodin@aol.com","tezbo@me.com","wildixon@live.com","seasweb@optonline.net","mdielmann@hotmail.com","sriha@live.com","raides@msn.com","sopwith@comcast.net","giafly@me.com","skythe@me.com","dpitts@comcast.net","rfisher@yahoo.com","jaarnial@mac.com","dmbkiwi@live.com","joglo@att.net","joelw@outlook.com"];

var types = ["CSP", "HDS", "HSE"];

// retrieve a randomly-generated identity for a TA or admin
function getRandomIdentity(isAdmin) {
	if (isAdmin) {
		return [
			names[Math.floor(Math.random() * names.length)],
			emails[Math.floor(Math.random() * emails.length)]
		];
	} else {
		return [
			names[Math.floor(Math.random() * names.length)],
			phones[Math.floor(Math.random() * phones.length)],
			emails[Math.floor(Math.random() * emails.length)],
			types[Math.floor(Math.random() * types.length)]
		];
	}
}

// insert the usual A-F letter days
process.stdout.write("Inserting standard letter days... ");
con.query('INSERT INTO letterDays (name) VALUES ?;', [[['A'], ['B'], ['C'], ['D'], ['E'], ['F']]], function(err) {
	if (!err) {
		console.log("Done.");

		// construct TA profiles
		var tas = [];
		for (var i = 0; i < NUM_TAS; i++) {
			tas.push(getRandomIdentity(false));
		}

		// insert TA profiles
		process.stdout.write("Inserting TA profiles... ");
		con.query('INSERT INTO TAs (name, phone, email, type) VALUES ?;', [tas], function(err) {
			if (!err) {
				console.log("Done.");

				// construct admin profiles
				var admins = [];
				for (var i = 0; i < NUM_ADMINS; i++) {
					admins.push(getRandomIdentity(true));
				}

				// insert admin profiles
				process.stdout.write("Inserting admin profiles... ");
				con.query('INSERT INTO admins (name, email) VALUES ?;', [admins], function(err) {
					if (!err) {
						console.log("Done.");

						// get letter days (with uid)
						con.query('SELECT * FROM letterDays;', function(err, days) {
							if (!err && days !== undefined && days.length > 0) {
								// get TAs (with uid)
								con.query('SELECT * FROM TAs;', function(err, TAs) {
									if (!err) {
										var assignments = [];

										for (var i = 0; i < days.length; i++) {
											for (var n = 0; n < TAS_PER_LETTER_DAY; n++) {
												assignments.push([TAs[Math.floor(Math.random() * TAs.length)].uid, days[i].uid]);
											}
										}

										// insert assignments into letterDayAssgn table
										process.stdout.write("Assigning TAs to letter days... ");
										con.query('INSERT INTO letterDayAssgn (taUID, letterUID) VALUES ?;', [assignments], function(err) {
											if (!err) {
												console.log("Done.");
												console.log("Test suite complete.");
											} else {
												throw new Error("Failed to insert assignments: " + err.message);
											}
										});
									} else {
										throw new Error("Couldn't retrieve TAs from DB: " + err.message);
									}
								});
							} else {
								throw new Error("Couldn't retrieve letter days from DB: " + err.message);
							}
						});
					} else {
						throw new Error("Failed to add test admin profiles: " + err.message);
					}
				});
			} else {
				throw new Error("Failed to add test TA profiles: " + err.message);
			}
		});
	} else {
		throw new Error("Failed to insert testing letter days: " + err.message);
	}
});