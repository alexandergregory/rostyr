
var LocalStrategy = require('passport-local').Strategy;

var db = require('../models');

module.exports = function(passport) {

    passport.serializeUser(function(user, done) {
	done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
	db.User.find({where: {id: id}}).success(function(user){
	    done(null, user);
	}).error(function(err){
	    done(err, null);
	});
    });

    passport.use('local-setpass', new LocalStrategy({ 
	usernameField: 'email', 
	passwordField: 'pass',
	passReqToCallback: true
    }, function(req, email, pass, done) {
	process.nextTick(function () {
	    db.User.find({ where: { email: email } }).success(function(user) {
		if (!user) {
		    // console.log('user not matched');
		    return done(null, false, { message: 'Unknown user ' + username });
		}
		user.pass = user.generateHash(pass);
		user.save().success(function(user) {
		    return done(null, user);
		});
	    }).error(function(err) {
		console.log(err);
		res.redirect('/');
	    });
	});
    }));

    passport.use('local-login', new LocalStrategy({
    	usernameField: 'email',
    	passwordField: 'pass',
    	passReqToCallback: true
    }, function(req, email, pass, done) {
	process.nextTick(function () {
            db.User.find({ where: { email: email } }).success(function(user) {
                if (!user) {
                    return done(null, false, { message: 'Invalid email or password' });
                }
		if (!user.validPassword(pass)) {
		    return done(null, false, { message: 'Invalid email or password' });
		}
		return done(null, user);
            }).error(function(err) {
                console.log(err); 
                res.redirect('/');
            });
        });
    }));
}
