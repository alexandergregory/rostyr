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
		     order: 'date ASC',
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

function pushDateObj(jobs, date, cb) {
    var dateObj = { date: null, jobs: null };
    async.filter(jobs, function(job, cb) {
	cb(job.date.toDateString() == date);
    }, function(result) {
	dateObj.jobs = result;
	dateObj.date = result[0].date;
	cb(dateObj);
    });
}

function sortBookings(jobs) {
    async.each(jobs, function(job) {
	// something
    });
}

exports.job = function(req, res) {

    var user;
    var jobs;
    var root = req.protocol + '://' + req.get('host');
    var display = { dates: [] };

    async.parallel([
	function(cb) {
	    getUser(req.user.id, function(err, user) { cb(err, user) });
	},
	function(cb) {
	    getJobs(req.user.id, function(jobs) { cb(null, jobs) });
	},
    ], function(err, results) {

	if(err) { console.log(JSON.stringify(err)) };

	user = results[0];
	jobs = results[1];
	// jobs = sortBookings(results[1]);

	// Get uniq dates from jobs array and push to disply object
	var uniqDates = _.uniq(_.map(_.pluck(jobs, 'date'), function(date) { return date.toDateString() }));
	async.each(uniqDates, function(date, cb) {
	    pushDateObj(jobs, date, function(dateObj) { display.dates.push(dateObj); cb(); });
	}, function(err) {
	    if(err) { console.log(err) };

	    console.log(JSON.stringify(display, undefined, 2));

	    res.render("job", {
		title: "Jobs",
		user: user,	
		root: root,
		display: display,
		_:_,
		async: async,
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
    db.User.find({ where: { id: req.user.id } }).then(function(user) {

	db.User.findAll({ where: { UserId: user.id }, include: [db.Position] }).then(function(staff) {

	    console.log(JSON.stringify(user, undefined, 2));

	    console.log(JSON.stringify(staff, undefined, 2));

            res.render('staff', {
		title: 'Staff',
		user: user,
		staff: staff,
		message: req.flash('message')
            });
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
