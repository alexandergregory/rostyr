var routes  = require('./routes');
var user    = require('./routes/user');
var dash    = require('./routes/dash');
var job     = require('./routes/job');
var staff   = require('./routes/staff');
var db      = require('./models');

module.exports = function(app, router, passport) {



    router.use(function(req, res, next) {
	console.log('something is happening');
	next();
    });

    router.get('/', function(req, res) {
	res.json({ message: 'api success'});
    });

    router.route('/booking/:id')
	.post(function(req, res) {

	    console.log(req.body.start);
	    console.log(req.body.number);

	    db.Job.find(req.body.jobId).success(function(job) {

		// get number of bookings
		for(var i = 0; i < req.body.number; i++) {
		    db.Booking.create({ start: req.body.start, position: req.body.position }).success(function(booking) {

			booking.setJob(job);

			console.log({ message: 'created new booking for ' + req.body.start });
		    });
		}
	    });

	    res.redirect('/job');
	});


    app.use('/api', router);




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

    app.get('/dash', ensureAuthenticated, dash.index);
    app.get('/job', ensureAuthenticated, job.index);
    app.post('/job/create', ensureAuthenticated, job.create);
    app.get('/job/remove', ensureAuthenticated, job.remove);

    app.get('/account', ensureAuthenticated, dash.account);
    app.post('/user/update', ensureAuthenticated, user.update);

    app.get('/staff', ensureAuthenticated, staff.index);
    app.post('/staff/create', ensureAuthenticated, staff.create);
    app.get('/staff/remove', ensureAuthenticated, staff.remove);

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

    // wrap secured areas in this
    // NEED TO DIFFERENTIATE BETWEEN AUTHENTICATING USERS AND STAFF
    function ensureAuthenticated(req, res, next) {
    	if (req.isAuthenticated()) { return next(); }
    	res.redirect('/login');
    }
}
