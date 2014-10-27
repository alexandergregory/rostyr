var db = require('../models')

exports.index = function(req, res) {
    db.User.find({ where: { id: req.user.id }, include:[{model: db.Job, include: [ db.Client, db.Location, db.EventType]} ] }).success(function(user) {
	res.render('dash', { 
	    title: 'Dashboard', 
	    user: user,
	    message: req.flash('message')
	});
    });
}
exports.account = function(req, res) {
    db.User.find({ where: { id: req.user.id }, include: [db.Job] }).success(function(user) {
	res.render('account', {
	    title: 'Account',
	    user: user,
	    message: req.flash('message')
	});
    });
}
