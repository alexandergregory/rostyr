var async = require('async');
var _ = require('underscore');
var db = require('../models');

exports.index = function(req, res) {
    db.User.find({ where: { id: req.user.id }, 
		   include:[{model: db.Job, 
			     include: [ db.Client, db.Location, db.EventType, db.Booking ]
		   }],
		   order: [ [db.Job, 'date'], [ db.Job, db.Booking, 'start', 'ASC' ] ]
		 }).success(function(user) {

        res.render('job', {
            title: 'Jobs',
            user: user,
	    _ : _,
	    db : db,
            message: req.flash('message')
        });
    });
}
exports.create = function(req, res) {

    var user = db.User.find(req.user.id).success(function(user) {

    var reqx = req.body
        , dd   = reqx.day
        , mm   = reqx.month - 1
        , yy   = reqx.year
        , date = new Date(yy,mm,dd)
        , pax  = reqx.pax
	, reqLocation = reqx.location
	, reqClient = reqx.client
	, reqEventType = reqx.eventType
        ; 

	db.Job.create({ date: date, pax: pax }).success(function(job) {

	    user.addJob(job);

	    async.parallel([
		function(cb) {
		    addObject(reqClient, db.Client, function(client) {
			client.addJob(job);
			cb();
		    });
		},
		function(cb) {
		    addObject(reqLocation, db.Location, function(location) {
			location.addJob(job);
			cb();
		    });
		},
		function(cb) {
		    addObject(reqEventType, db.EventType, function(eventType) {
			eventType.addJob(job);
			cb();
		    });
		},
	    ], function(err, results) {
		if(err) {
		    console.log(err);
		}
	    });

	    req.flash('message', 'New job created successfully');

	    if(req.body.redirect == 'dash') {
		res.redirect('/dash');
	    } else {
		res.redirect('/job');
	    }
	});
    });
}
exports.remove = function(req, res) {

    var id = req.query.id
      , redirect = req.query.redirect
      ;

    db.Job.find(id).success(function(job) {
	job.destroy().success(function() {
	    if(redirect == 'dash') {
		res.redirect('/dash');
	    } else {
		res.redirect('/job');
	    }
	});
    });

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
