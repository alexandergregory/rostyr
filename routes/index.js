var db = require('../models')

exports.index = function(req, res) {
    db.User.findAll({
	include: [db.Job]
    }).success(function(jobs) {

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

    }).error(function(err) {

	console.log(err);
	res.send("error retrieving jobs");

    });
}
