var _ = require('underscore');
var humanize = require('humanize');
var db = require('../models');

exports.index = function(req, res) {
    db.User.find({ where: { id: req.user.id }, 
		   include:[ db.Client, db.Location, db.EventType, db.Position, {model: db.Job, 
			     include: [ db.Client, db.Location, db.EventType, db.Booking ]
		   }],
		   order: [ [db.Job, 'date'], [ db.Job, db.Booking, 'start', 'ASC' ] ]
		 }).success(function(user) {

		     res.render('job', {
			 title: 'Jobs',
			 user: user,
			 _ : _,
			 humanize: humanize,
			 db : db,
			 message: req.flash('message'),
		     });
		 });
}
