var async   = require('async');
var _       = require('underscore');
var humanize = require('humanize');
var routes  = require('./routes');
var user    = require('./routes/user');
var tools   = require('./routes/tools');
var db      = require('./models');

module.exports = function(app, router, passport) {

    router.use(function(req, res, next) {
	console.log('something is happening');
	next();
    });

// ===== //
// STAFF //
// ===== //

    router.route('/staff')
	.post(ensureAuthenticated, ensureUser, function(req, res) {

	    var newStaff = { firstName: req.body.firstName, lastName: req.body.lastName, email: req.body.email, phone: req.body.phone };

	    genNewCallsign(newStaff, function(callsign) {
		db.Staff.create({ firstName: newStaff.firstName, lastName: newStaff.lastName, callSign: callsign, email: newStaff.email, phone: newStaff.phone }).then(function(staff) {
		    staff.setUser(req.user);

		    console.log(req.body.position);
		    var positions = req.body.position.split(',');
		    console.log(positions);

		    async.each(positions, function(pos, cb) {
			addObject(pos, db.Position, req.user, function(position) {
			    staff.addPosition(position);
			    cb();
			});
		    }, function() {

			tools.getRootUrl(req, function(rootUrl) {
			    console.log(rootUrl);

				var subject = 'Welcome to Rostyr'
				var context = {
				    url: rootUrl,
				    title: 'Welcome to Rostyr',
				    staff: staff,
				}

				// tools.makeMail(req, res, staff.email, 'emailStaffCreate', subject, context, function() {
				tools.makeMail(req, res, 'leon.stirkwang@gmail.com', 'emailStaffCreate', subject, context, function() {
				    console.log('sent a mail to ' + staff.callSign);
				});

			    req.flash('message', 'New staff member added successfully');		    
			    res.redirect('/staff');
			});
		    });
		});
	    });
	});

    router.route('/staff/:id')

	.post(ensureAuthenticated, ensureUser, function(req, res) {

	    db.Staff.find({ where: { id: req.param('id') }, include: [ db.Position ] }).then(function(staff) {

		if(staff.firstName == req.body.fName && staff.lastName == req.body.lName) {
		    updateStaff(req, staff, staff.callsign, function() {
			res.redirect('/staff');
		    });
		} else {
		    var newStaff = { firstName: req.body.fName, lastName: req.body.lName, email: req.body.email, phone: req.body.phone };
		    genNewCallsign(newStaff, function(callsign) {
			updateStaff(req, staff, callsign, function() { 
			    res.redirect('/staff'); 
			});
		    });
		}

	    });
	});

    router.route('/staff/remove/:id')

	.get(ensureAuthenticated, ensureUser, function(req, res) {

	    db.Staff.find(req.param('id')).then(function(staff) {
		staff.destroy().then(function() {
	
		    // if last of position then delete position

		    req.flash('message', 'Staff member removed successfully');
		    res.redirect('/staff');
		});
	    });

	});



// === //
// JOB //
// === //

    router.route('/job')

	.post(ensureAuthenticated, function(req, res) {

            var date = new Date(req.body.year,req.body.month-1,req.body.day,req.body.time.substring(0,2),req.body.time.substring(2));

            db.Job.create({ date: date, pax: req.body.pax }).then(function(job) {

		async.parallel([
		    function(cb) {
			req.user.addJob(job).then(function() { cb() });
		    },
                    function(cb) {
			addObject(req.body.client, db.Client, req.user, function(client) {
                            client.addJob(job).then(function() { cb() });
			});
                    },
                    function(cb) {
			addObject(req.body.location, db.Location, req.user, function(location) {
                            location.addJob(job).then(function() { cb() });
			});
                    },
                    function(cb) {
			addObject(req.body.eventType, db.EventType, req.user, function(eventType) {
                            eventType.addJob(job).then(function() { cb() });
			});
                    },
		], function(err) {
                    if(err) { console.log(err); }
		    req.flash('message', 'New job created successfully');
		    res.redirect('/' + req.body.redirect);
		});
            });

	});

    router.route('/job/:id')

	.post(ensureAuthenticated, function(req, res) {

            var date = new Date(req.body.year,req.body.month,req.body.day,req.body.time.substring(0,2),req.body.time.substring(2));

	    db.Job.find(req.param('id')).then(function(job) {
		job.date = date;
		job.pax = pax;

		// if client, location or event type have changed then must find, remove and replace with new values
		// if changes are made we need to email out all confirmed and pending staff

		async.each(Object.keys(req.body), function(key, cb) {
		    switch (key) {
		    case client:
			console.log('client');
			cb();
			break;
		    case location:
			console.log('location');
			cb();
			break;
		    case eventType:
			cosole.log('eventType');
			cb();
			break;
		    default:
			cb();
			break;			
		    }
		});

		job.save().then(function() { 
		    // something });
		}).catch(function(err) {
		    console.log(err);
		});

	    });
	});

    router.route('/job/remove/:id')

	.get(ensureAuthenticated, function(req, res) {

	    var redirect = req.query.redirect;

	    db.Job.find(req.param('id')).then(function(job) {
		job.destroy().then(function() {
		    req.flash('message', 'Job deleted');
		    if(redirect == 'dash') { res.redirect('/dash') } else { res.redirect('/job') }
		});
	    });

	})



// ======= //
// BOOKING //
// ======= //

    router.route('/booking/:job_id')

    // create a new booking and attach the current job
	.post(function(req, res) {

	    // NEED FUNCTION TO SANITISE "START" INPUT //

	    console.log(req.body.start);
	    console.log(req.body.number);

	    db.Job.find(req.body.jobId).then(function(job) {

		// get number of bookings
		for(var i = 0; i < req.body.number; i++) {

		    var start = job.date;
		    start.setHours(req.body.start.substring(0,2));
		    start.setMinutes(req.body.start.substring(2));
		    console.log(start);

		    db.Booking.create({ start: start, position: req.body.position }).then(function(booking) {
			booking.setJob(job);
			console.log({ message: 'created new booking for ' + req.body.start });
			res.redirect('/job');
		    });
		}
	    });
	})

    // delete all bookings when job is deleted



// === //
// ASK //
// === //

    router.route('/ask')

	.post(function(req, res) {

// create all the ask associations linking staff and bookings according to allocations in the submitted form (Staffs ==> Asks ==> Bookings)

	    Object.keys(req.body).forEach(function(key) { // for each booking field thats passed. keys are booking ids
		console.log(key + ' ' + req.body[key]);

// don't create the ask if there is already an ask for that booking/whatever
// confirmed OR pending ask does not exist for the booking number (MUST BE FALSE OR NON-EXISTANT)

		db.Booking.find({ where: { id: key }, include: [ db.Ask ] }).then(function(booking) { 

		    var pendingAsks =  _.find(booking.Asks, function(ask) { return ask.accepted == true || ask.accepted == null });
		    if(booking.Asks.length==0 || !pendingAsks ) {

//set accept and decline tokens

			async.parallel([
			    function(cb) {
				tools.setToken(function(token1) {
				    //something
				    cb(null, token1);
				});
			    },
			    function (cb) {
				tools.setToken(function(token2) {
				    //something
				    cb(null, token2);
				});
			    }
			], function(err, results) {
			    console.log(results);

			    db.Ask.create({ dateEmailed: new Date(), acceptToken: results[0], declineToken: results[1] }).then(function(ask) {
				db.Booking.find(key).then(function(booking) { ask.setBooking(booking) }); // THIS MAY BE UNNECCESSARY SEE ABOVE FUNCTION
				db.Staff.find({ where: { firstName: req.body[key] } }).then(function(staff) { 
				    ask.setStaff(staff);

// email out as we create the associations

				    tools.getRootUrl(req, function(rootUrl) {

					console.log(rootUrl);

					booking.getJob({ include: [db.Client, db.Location, db.EventType] }).then(function(job) {

					    var subject = humanize.date('l jS F', job.date) + " - " + booking.start + " - " + job.Client.name + " - " + job.Location.name;
					    var context = {
						url: rootUrl,
						title: subject,
						ask: ask.id,
						accept: ask.acceptToken,
						decline: ask.declineToken,

						date: humanize.date('l jS F', job.date),
						pax: job.pax,
						eventType: job.EventType.name,
						location: job.Location.name,
						position: 'BLAH BLAH',
						start: booking.start,	
					    }

					    // tools.makeMail(req, res, staff.email, 'emailAsk', subject, context, function() {
					    tools.makeMail(req, res, 'leon.stirkwang@gmail.com', 'emailAsk', subject, context, function() {
						console.log('sent a mail');
					    });
					});
				    });
				});
			    });
			});
	            }
		});
	    });

	    res.redirect('/job');


	    // disable the input fields or something while waiting for response
	    // or colour coding or some shit to indicate status
	    // additional colour response on dash page to show confirm status of jobs
	})

	.get(function(req, res) {
	    db.Ask.find(req.query.ask).then(function(ask) {
		if(req.query.token == ask.acceptToken) {
		    ask.updateAttributes({ accepted: true, acceptToken: null, declineToken: null, dateRespond: new Date() }).then(function() {
			// redirect to some confirmation page
		    }).catch(function(err) { console.log(err) });
		} else if(req.query.token == ask.declineToken) {
		    ask.updateAttributes({ accepted: false, acceptToken: null, declineToken: null, dateRespond: new Date() }).then(function() {
			// auto generate new ask for booking and email

			// get user
			ask.getBooking().then(function(booking) { booking.getJob().then(function(job) { 

			    job.getUser().then(function(user) {
				console.log('USER ==> ' + user.firstName + ' ' + user.lastName);

				var date = job.date.toString();

				user.getStaffs().then(function(staff) {
				    console.log('NO. OF STAFF ==> ' + staff.length);
				    var allStaff = staff;
				    var allStaffIds = _.pluck(allStaff, 'id');
				    var askedStaff = [];

				    var dateJobs = _.find(user.Jobs, function(dateJob) { return dateJob.date.toString() == date });

				    dateJobs.forEach(function(job) {
					job.Bookings.forEach(function(booking) {
					    if(booking.Asks.length > 0) {
						booking.Asks.forEach(function(ask) {
						    askedStaff.push(ask.Staff.id);
						});
					    }
					});
				    });

				    var availableStaff = _.difference(allStaffIds, askedStaff);

				    // now need to filter by postition and then select staff

				});
			    });
			}); });

			// redirect to some confirmation page
		    }).catch(function(err) { console.log(err) });
		} else {
		    console.log('tokens are wrong or expired or whatever');
		    // redirect to some error page
		}
	    });
		res.redirect('/job'); // THIS NEEDS TO GO AWAY BEFORE GOING TO PRODUCTION
	});

// ==== //
// FIND //
// ==== //

    router.route('/find/client')
	.get(function(req, res) {
	    db.Client.findAll({ attributes: ['name'] }).then(function(clients) {
		console.log(clients.name);
		res.send(clients);
	    });
	});

    router.route('/find/location')
	.get(function(req, res) {
	    db.Location.findAll({ attributes: ['name'] }).then(function(locs) {
		console.log(locs.name);
		res.send(locs);
	    });	    
	});

    router.route('/find/eventType')
	.get(function(req, res) {
	    db.EventType.findAll({ attributes: ['name'] }).then(function(eventTypes) {
		console.log(eventTypes.name);
		res.send(eventTypes);
	    });	    
	});

    router.route('/find/position')
	.get(function(req, res) {
	    db.Position.findAll({ attributes: ['name'] }).then(function(positions) {
		console.log(JSON.stringify(positions));
		res.send(positions);
	    });	    
	});

    app.use('/api', router);




    app.get('/', routes.index);

    app.post('/user/create', user.create);

    app.get('/user/verify', user.verify);

    app.route('/user/setup')
	.get(user.askpass)
	.post(passport.authenticate('local-setpass', {
	    successRedirect: '/dash',
	    failureRedirect: '/login',
	    failureFlash: true
	}));

    app.post('/user/update', ensureUser, user.update);

    app.get('/dash', ensureAuthenticated, ensureUser, routes.dash);

    app.get('/account', ensureAuthenticated, ensureUser, routes.account);
    app.get('/job', ensureAuthenticated, ensureUser, routes.job);
    app.get('/staff', ensureAuthenticated, ensureUser, routes.staff);

    app.get('/login', function(req, res) {
	res.render('login', { title: 'Login', user: req.user, message: req.flash('error') });
    });

    app.post('/login', passport.authenticate('local-login', {
//	successRedirect : '/dash', 
	successRedirect : '/job',
	failureRedirect : '/login', 
	failureFlash : true 
    }));
    
    app.get('/logout', function(req, res) {
	req.logout();
	res.redirect('/');
    });

    // wrap secured areas in this
    function ensureAuthenticated(req, res, next) {
    	if (req.isAuthenticated()) { return next(); }
    	res.redirect('/login');
    }
    function ensureUser(req, res, next) {
	if(!req.user) {
	    res.redirect('/login');
	} else {
	    db.User.find({ where: { id: req.user.id }, include: [db.Role] }).then(function(user) {
		if(_.where(user.Roles, { name: 'user' })) { return next(); }
		res.redirect('/login');
	    });
	}
    }
    function ensureStaff(req, res, next) {
	if(!req.user) {
	    res.redirect('/login');
	} else {
	    db.User.find({ where: { id: req.user.id }, include: [db.Role] }).then(function(user) {
                if(_.where(user.Roles, { name: 'staff' })) { return next(); }
                res.redirect('/login');
            });
	}
    }
    function addObject(obj, typ, user, cb) {
	typ.find({ where: { name: obj } }).then(function(object) {
	    if(object) {
		cb(object);
	    } else {
		var new_obj = typ.build({
		    name: obj
		});
		new_obj.save().then(function(object) {
		    object.addUser(user);
		    cb(object);
		}).catch(function(err) {
		    cb(err);
		});
	    }
	});
    }
    function genNewCallsign(newStaff, cb) {
	db.Staff.findAll({ where: { firstName: newStaff.firstName } }).then(function(matchedStaff) {

	    var lastNames = _.pluck(matchedStaff, 'lastName');

	    if(matchedStaff.length==0) {
		cb(newStaff.firstName);
	    }
	    else if (matchedStaff && _.find(_.map(lastNames, function(ln) { return ln.charAt(0) }), function(lnChar) { return lnChar == newStaff.lastName.charAt(0) }) == null) {

		async.each(matchedStaff, function(staff, cb) {
		    staff.callSign = staff.firstName + " " + staff.lastName.charAt(0);
		    staff.save().then(cb()).catch(function(err) { console.log(err); });
		}, function(err) {
		    if(err) { console.log(err); }
		    cb( newStaff.firstName + " " + newStaff.lastName.charAt(0) );			    
		});

	    }
	    else if (matchedStaff && _.find(lastNames, function(lnFull) { return lnFull == newStaff.lastName }) == null) {

		var sameInitial = _.filter(matchedStaff, function(match) { return match.lastName.charAt(0) == newStaff.lastName.charAt(0) });

		async.each(sameInitial, function(staff, cb) {
		    staff.callSign = staff.firstName + " " + staff.lastName;
		    staff.save().then(cb()).catch(function(err) { console.log(err); });
		}, function(err) {
		    if(err) { console.log(err); }
		    cb( newStaff.firstName + " " + newStaff.lastName );
		});

	    }
	    else {
		console.log('already entered the staff member or two people with the same name');
		cb('SEND CONFIRMATION MESSAGE ASKING TO PROCEED WITH DB ENTRY');
	    }
	}).catch(function(err) {
	    console.log(err);
	    cb(err);
	});
    }
    function updateStaff(req, staff, callsign, cb) {
	staff.updateAttributes({ firstName: req.body.fName, lastName: req.body.lName, callSign: callsign, email: req.body.email, phone: req.body.phone }).then(function(staff) {

	    var positions = req.body.position.split(',');
	    var existPos = _.pluck(staff.Positions, 'name');

	    var add = _.difference(positions, existPos);
	    var subtract = _.difference(existPos, positions);

	    async.parallel([
		function(cb) {
		    async.each(add, function(pos, cb) {
			addObject(pos, db.Position, req.user, function(position) {
			    staff.addPosition(position);
			    cb();
			});
		    }, function() {
			cb();
		    });
		},
		function(cb) {
		    async.each(subtract, function(pos, cb) {
			db.Position.find({ where: { name: pos } }).then(function(position) {
			    staff.removePosition(position);
			    cb();
			});
		    }, function() {
			cb();
		    });
		}
	    ], function() {
		req.flash('message', staff.callSign + "'s profile has updated successfully");
		cb();
	    });
	});
    }
}
