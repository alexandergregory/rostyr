var db = require('../models')

exports.create = function(req, res) {

    var reqx = req.body;

    console.log(reqx.subject);

    db.User.find({ where: { email: reqx.email } }).success(function(user) {
	db.Subject.create({ name: reqx.subject('name') }).success(function(sub) {
	    sub.setUser(user).success(function() {
		res.redirect('/')
	    })
	})
    })
}

exports.destroy = function(req, res) {

    var reqx = req.body;

    db.User.find({ where: { email: reqx.email } }).success(function(user) {
	db.Task.find({ where: { id: req.param('task_id') } }).success(function(task) {
	    task.setUser(null).success(function() {
		task.destroy().success(function() {
		    res.redirect('/')
		})
	    })
	})
    })
}
