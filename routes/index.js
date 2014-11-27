var _ = require('underscore');
var humanize = require('humanize');
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

exports.job = function(req, res) {
    db.User.find({ where: { id: req.user.id },
                   include:[ db.Client, db.Location, db.EventType, db.Position,
			     { model: db.Job,
                               include: [ db.Client, db.Location, db.EventType, db.Booking ]
			     },
			     { model: db.Staff,
			       include: [ db.Position ]
			     }
			   ],
                   order: [ [db.Job, 'date'], [ db.Job, db.Booking, 'start', 'ASC' ] ]
                 }).then(function(user) {

                     res.render('job', {
                         title: 'Jobs',
                         user: user,
                         _ : _,
                         humanize: humanize,
                         message: req.flash('message'),
                     });
                 });
}


// ======== //
// ACCOUNTS //
// ======== //

exports.account = function(req, res) {
    db.User.find({ where: { id: req.user.id }, include: [db.Job] }).then(function(user) {
        res.render('account', {
            title: 'Account',
            user: user,
            message: req.flash('message')
        });
    });
}
