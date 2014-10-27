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
exports.create = function(req, res) {

    var reqx = req.body
      , firstName = reqx.firstName
      , lastName = reqx.lastName
      , email = reqx.email
      , phone = reqx.phone
      ;

    db.Staff.create({ firstName: firstName, lastName: lastName, email: email, phone: phone }).success(function(staff) {

	staff.setUser(req.user);

	addPosition(req.body.position, function(position) {
	    staff.addPosition(position);
	    res.redirect('/staff');
	});
    });
}
exports.remove = function(req, res) {
    var id = req.query.id;

    db.Staff.find(id).success(function(staff) {
        staff.destroy().success(function() {
            res.redirect('/staff');
        });
    });

}
var addPosition = function(pos, cb) {
    db.Position.find({ where: { name: pos } }).success(function(position) {
        if(position) {
            cb(position);
        } else {
            var new_pos = db.Position.build({
                name: pos
            });
            new_pos.save().success(function(position) {
                cb(position);
            }).error(function(err) {
                cb(err);
            });
        }
    });
}
