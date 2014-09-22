var routes  = require('./routes');
var user    = require('./routes/user');
var dash    = require('./routes/dash');
var db      = require('./models');

module.exports = function(app, router, passport) {

    app.get('/', routes.index);

    app.post('/user/create', user.create);

    app.get('/user/verify', user.verify);

    app.route('/user/setup')
	.get(user.askpass)
	.post(passport.authenticate('local-setpass', {
	    successRedirect: '/dash',
	    failureRedirect: '/login',
	    failureFlash: true
	}));

    app.post('/user/update', user.update);

    app.get('/dash', ensureAuthenticated, dash.index);

    app.get('/login', function(req, res) {
	res.render('login', { title: 'Login', user: req.user, message: req.flash('error') });
    });

    app.post('/login', passport.authenticate('local-login', {
	successRedirect : '/dash', 
	failureRedirect : '/login', 
	failureFlash : true 
    }));
    
    app.get('/logout', function(req, res) {
	req.logout();
	res.redirect('/');
    });

    app.get('/user', user.index);

    // wrap secured areas in this
    function ensureAuthenticated(req, res, next) {
    	if (req.isAuthenticated()) { return next(); }
    	res.redirect('/login');
    }
}
