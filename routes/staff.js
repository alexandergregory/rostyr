var db = require('../models');

exports.index = function(req, res) {
    db.User.find({ where: { id: req.user.id }, include: [{model: db.Staff, include: [db.Position] }] }).success(function(user) {
        res.render('staff', {
            title: 'Staff',
            user: user,
            message: req.flash('message')
        });
    });
}
