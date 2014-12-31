var async = require('async');
var _ = require('underscore');
var humanize = require('humanize');
var tools = require('./tools');
var db = require('../models');

// === //
// '/' //
// === //

exports.index = function(req, res) {
    db.User.findAll({
	include: [db.Job]
    }).then(function(jobs) {

	var error = req.flash('error');

	var errArr = [];

	try {
	    for(var prop in error[0]) {
		errArr.push(error[0][prop][0])
	    }
	} catch (error) {
	    console.log(error);
	}

	res.render('index', {
	    title: 'Rostyr',
	    user: req.user,
	    errors: errArr, // need to sort this shit out
	})

    }).catch(function(err) {

	console.log(err);
	res.send("error retrieving jobs");

    });
}


// ==== //
// DASH //
// ==== //

exports.dash = function(req, res) {

    db.User.find({ where: { id: req.user.id }, 
		   include:[ db.Client, db.Location, db.EventType,
			     { model: db.Job, 
			       include: [ db.Client, db.Location, db.EventType ]
			     }
			   ]
		 }).then(function(user) {

		     res.render('dash', {
			 title: 'Dashboard',
			 user: user,
			 humanize: humanize,
			 message: req.flash('message')
		     });
		 });
}


// === //
// JOB //
// === //

function getUser(id, cb) { 
    db.User.find({ where: { id: id }, attributes: ['id', 'firstName', 'lastName'] }).then(function(user) {
	cb(null, user);
    }).catch(function(err) {
	console.log(err);
	cb(err, null);
    });
}

function getJobs(userId, cb) {
    today = new Date();
    db.Job.findAll({ where: db.Sequelize.and(["date >= ?", today], { UserId: userId }), 
			     attributes: ['id', 'date', 'pax'], 
			     include: [
				 { model: db.Client, attributes: ['name'] },
				 { model: db.Location, attributes: ['name'] },
				 { model: db.EventType, attributes: ['name'] },
				 { model: db.Booking, attributes: ['id', 'start', 'position', 'JobId'] },
			     ] }).then(function(jobs) {
				 cb(jobs);
			     }).catch(function(err) {
				 console.log(err);
			     });
}

function getAsks(jobIds, cb) {
    db.Ask.findAll({ where: { JobId: jobIds }, attributes: ['id', 'accepted', 'StaffId'] }).then(function(asks) {
	cb(asks);
    }).catch(function(err) {
	console.log(err);
    });
}

function getStaff(userId, cb) {
    db.Staff.findAll({ where: { UserId: userId },
		       attributes: ['id', 'firstName', 'lastName'],
		     }).then(function(staff) {
			 cb(staff);
		     }).catch(function(err) {
			 console.log(err);
		     });
}

function pushDateObj(jobs, date, cb) {
    var dateObj = { jobs: null };
    async.filter(jobs, function(job, cb) {
	cb(job.date.toDateString() == date);		
    }, function(result) {
	dateObj.jobs = result;
	cb(dateObj);
    });
}

exports.job = function(req, res) {

    var user;
    var root = req.protocol + '://' + req.get('host');
    var display = { dates: [] };

    var jobs;
    var staff;

    async.parallel([
	function(cb) {
	    getUser(req.user.id, function(err, user) { cb(err, user) });
	},
	function(cb) {
	    getJobs(req.user.id, function(jobs) { cb(null, jobs) });
	},
	function(cb) {
	    getStaff(req.user.id, function(staff) { cb(null, staff) });
	},
    ], function(err, results) {

	if(err) { console.log(JSON.stringify(err)) };

	user = results[0];
	jobs = results[1];
	staff = results[2];

	// SORT BOOKINGS WITHING JOBS //

	var jobsSorted = [];

	async.each(jobs, function(job, cb) {
	    var starts = _.map(_.pluck(job.Bookings, 'start'), function(obj) { return humanize.date('Hi', obj); });
	    var uniqStarts = _.uniq(starts);

	    console.log(JSON.stringify(uniqStarts));

	    jobDisplayObj = { starts: [] };

	    async.each(uniqStarts, function(startTime, cb) {

		// IF ONLY ONE BOOKING THEN SKIP MAPPING STEP //

		var posObj = _.filter(job.Bookings, function(booking) { return humanize.date('Hi', booking.start) == startTime });
		var positions = _.pluck(posObj, 'position');
		var uniqPos = _.uniq(positions);

		console.log(JSON.stringify(posObj));
		console.log(positions);
		console.log(uniqPos);

		// ITERATE THROUGH UNIQPOS WITH GIVEN START //
		// PUSH BOOKINGS TO 'POSITION' OBJECT //

		var start = { time: startTime, positions: [] };

		async.each(uniqPos, function(pos, cb) {
		    var bookings = _.filter(job.Bookings, function(booking) { return humanize.date('Hi', booking.start) == startTime && booking.position == pos });
		    console.log(JSON.stringify(bookings));
		    var position = { name: pos, bookings: bookings };
		    start.positions.push(position);
		    cb();
		}, function() {
		    jobDisplayObj.starts.push(start);
		    cb();
		});

	    }, function() {
		console.log(JSON.stringify(jobDisplayObj));
		cb(jobDisplayObj);
	    });
 
	}, function(jobDisplayObj) {
	    jobsSorted.push(jobDisplayObj);
	});

	var uniqDates = _.uniq(_.map(_.pluck(jobs, 'date'), function(date) { return date.toDateString() }));

	// FOR EACH UNIQUE DATE SET THE STAFF AND JOBS //
	async.each(uniqDates, function(date, cb) {   

	    async.parallel([
		function(cb) {
		    pushDateObj(jobs, date, function(dateObj) { display.dates.push(dateObj); cb(); }); // PUSH DATE OBJ TO DISPLAY OBJ
		},
		function(cb) {
		    console.log(JSON.stringify(staff));
		    // something to do with staff exclusion criteria
		    cb();
		},
	    ], function() {
		cb();
	    });

	}, function(err) {
	    if(err) { console.log(err) };

	    console.log(JSON.stringify(display));

	    res.render("job", {
		title: "Jobs",
		user: user,
		root: root,
		display: display,
		_:_,
		humanize: humanize,
		message: req.flash('message'),
	    });
	});
    });
}

// ===== //
// STAFF //
// ===== //

exports.staff = function(req, res) {
    db.User.find({ where: { id: req.user.id }, include: [{model: db.Staff, include: [db.Position] }] }).success(function(user) {
        res.render('staff', {
            title: 'Staff',
            user: user,
            message: req.flash('message')
        });
    });
}


// ======= //
// ACCOUNT //
// ======= //

exports.account = function(req, res) {
    db.User.find({ where: { id: req.user.id }, include: [db.Job] }).then(function(user) {
        res.render('account', {
            title: 'Account',
            user: user,
            message: req.flash('message')
        });
    });
}
