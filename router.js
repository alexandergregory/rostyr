var async   = require('async');
var _       = require('underscore');
var routes  = require('./routes');
var user    = require('./routes/user');
var dash    = require('./routes/dash');
var job     = require('./routes/job');
var staff   = require('./routes/staff');
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
	.post(ensureAuthenticated, function(req, res) {

	    var reqx = req.body
	    , firstName = reqx.firstName
	    , lastName = reqx.lastName
	    , email = reqx.email
	    , phone = reqx.phone
	    ;

	    db.Staff.create({ firstName: firstName, lastName: lastName, email: email, phone: phone }).success(function(staff) {

		staff.setUser(req.user);

		console.log(req.body.position);

		var positions = req.body.position.split(',');

		console.log(positions);

		async.each(positions, function(pos, cb) {
		    addPosition(pos, function(err, position) {
			if(err) { console.log(err); cb(err) }
			staff.addPosition(position);
			req.user.addPosition(position); // ONLY DO THIS IF USER DOESN'T ALREADY HAVE THE POSITION??
			cb();
		    });
		}, function(err) {
			console.log(err);
			req.flash('message', 'New staff member added successfully');		    
			res.redirect('/staff');
		});

	    });

	});

    router.route('/staff/:id')

	.post(ensureAuthenticated, function(req, res) {
	    db.Staff.find(req.param('id')).success(function(staff) {
		staff.updateAttributes({ firstName: req.body.fName, lastName: lName, email: req.body.email, phone: req.body.phone }).success(function() {

		    // UPDATE STAFF POSITIONS

		});
	    });
	});

    router.route('/staff/remove/:id')

	.get(ensureAuthenticated, function(req, res) {

	    db.Staff.find(req.param('id')).success(function(staff) {
		staff.destroy().success(function() {
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

	    var reqx = req.body
            , dd   = reqx.day
            , mm   = reqx.month - 1
            , yy   = reqx.year
	    , tt   = reqx.time
	    , hh   = tt.substring(0,2)
	    , mi   = tt.substring(2)
            , date = new Date(yy,mm,dd,hh,mi)
            , pax  = reqx.pax
            , reqLocation = reqx.location
            , reqClient = reqx.client
            , reqEventType = reqx.eventType
	    , redirect = reqx.redirect
            ;

            db.Job.create({ date: date, pax: pax }).success(function(job) {

		req.user.addJob(job);

		async.parallel([
                    function(cb) {
			addObject(reqClient, db.Client, function(client) {
                            client.addJob(job);
			    req.user.addClient(client);
                            cb();
			});
                    },
                    function(cb) {
			addObject(reqLocation, db.Location, function(location) {
                            location.addJob(job);
			    req.user.addLocation(location);
                            cb();
			});
                    },
                    function(cb) {
			addObject(reqEventType, db.EventType, function(eventType) {
                            eventType.addJob(job);
			    req.user.addEventType(eventType);
                            cb();
			});
                    },
		], function(err, results) {
                    if(err) {
			console.log(err);
                    }
		});

		req.flash('message', 'New job created successfully');

		if(redirect == 'dash') { res.redirect('/dash'); } else { res.redirect('/job'); }

            });

	});

    router.route('/job/:id')

	.post(ensureAuthenticated, function(req, res) {

	    var reqx = req.body
            , dd   = reqx.day
            , mm   = reqx.month - 1
            , yy   = reqx.year
	    , tt   = reqx.time
	    , hh   = tt.substring(0,2)
	    , mi   = tt.substring(2)
            , date = new Date(yy,mm,dd,hh,mi)
            , pax  = reqx.pax
            , reqLocation = reqx.location
            , reqClient = reqx.client
            , reqEventType = reqx.eventType
            ;

	})

    router.route('/job/remove/:id')

	.get(ensureAuthenticated, function(req, res) {

	    var redirect = req.query.redirect;

	    db.Job.find(req.param('id')).success(function(job) {
		job.destroy().success(function() {
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

	    console.log(req.body.start);
	    console.log(req.body.number);

	    db.Job.find(req.body.jobId).success(function(job) {

		// get number of bookings
		for(var i = 0; i < req.body.number; i++) {
		    db.Booking.create({ start: req.body.start, position: req.body.position }).success(function(booking) {

			booking.setJob(job);

			console.log({ message: 'created new booking for ' + req.body.start });
		    });
		}
	    });

	    res.redirect('/job');
	})

    // get all the bookings (accessed at GET http://something:8080/api/bookings)
	.get(function(req, res) {
	    db.Job.find({ where: { id: req.param('jobs_id') }, include: [ db.Booking ] }).success(function(job) {
		res.json(job.Bookings);
	    });
	});

    // delete all bookings when job is deleted



// ==== //
// FIND //
// ==== //

    router.route('/find/client')
	.get(function(req, res) {
	    db.Client.findAll().success(function(clients) {
		console.log(clients.name);
		res.send(clients);
	    });

	});

    router.route('/find/location')
	.get(function(req, res) {
		db.Location.findAll().success(function(locs) {
		    console.logs(locs.name);
		    res.send(locs);
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

    app.post('/user/update', ensureAuthenticated, user.update);

    app.get('/dash', ensureAuthenticated, dash.index);

    app.get('/account', ensureAuthenticated, dash.account);
    app.get('/job', ensureAuthenticated, job.index);
    app.get('/staff', ensureAuthenticated, staff.index);

    app.get('/login', function(req, res) {
	res.render('login', { title: 'Login', user: req.user, message: req.flash('error') });
    });

    app.post('/login', passport.authenticate('local-login', {
	successRedirect : '/dash', 
	failureRedirect : '/login', 
	failureFlash : true 
    }));
    
    app.get('/logout', function(req, res) {
	req.logout();
	res.redirect('/');
    });

    // wrap secured areas in this
    // NEED TO DIFFERENTIATE BETWEEN AUTHENTICATING USERS AND STAFF
    function ensureAuthenticated(req, res, next) {
    	if (req.isAuthenticated()) { return next(); }
    	res.redirect('/login');
    }

    var addObject = function(obj, typ, cb) {
	typ.find({ where: { name: obj } }).success(function(object) {
	    if(object) {
		cb(object);
	    } else {
		var new_obj = typ.build({
		    name: obj
		});
		new_obj.save().success(function(object) {
		    cb(object);
		}).error(function(err) {
		    cb(err);
		});
	    }
	});
    }
    var addPosition = function(pos, cb) { // THIS FUNCTION CAN BE MERGED INTO THE ADDOBJECT FUNCTION ABOVE
	db.Position.find({ where: { name: pos } }).success(function(position) {
            if(position) {
		cb(null, position);
            } else {
		var new_pos = db.Position.build({
                    name: pos
		});
		new_pos.save().success(function(position) {
                    cb(null, position);
		}).error(function(err) {
                    cb(err, position);
		});
            }
	});
    }

}
