var db = require('../models')

exports.index = function(req, res) {
  var user = db.User.find({ where: { id: req.user.id }, include: [db.Subject] }).success(function(user) {
      res.render('dash', { 
	  title: 'Dashboard', 
	  user: user,
	  messages: req.flash('message')
      });
  });
}
