var db = require('../models');

var nodemailer = require('nodemailer');
var fs = require('fs');
var ejs = require('ejs');
var bcrypt = require('bcryptjs');
var async = require('async');
var _ = require('underscore');

var nmtokens = fs.readFileSync('./.nodemailerpass').toString().split(':');
var nmservice = nmtokens[0]
  , nmuser = nmtokens[1]
  , nmpass = nmtokens[2];

var transporter = nodemailer.createTransport({
    service: nmservice,
    auth: {
        user: nmuser,
        pass: nmpass,
    }
});

var getRootUrl = function(req, cb) {
    var rootUrl = req.protocol + '://' + req.get('host');
    cb(rootUrl);
}

var sendMail = function(email, subject, content, next) {
    var mailOptions = {
	from: nmuser,
	to: email,
	subject: subject,
	html: content,
    }
    transporter.sendMail(mailOptions, next);
};

var makeMail = function(req, res, email, templateFile, subject, context, done) {

    // process.cwd() is the root node directory
    var template = process.cwd() + '/views/' + templateFile + '.ejs';

    // get template from file system
    fs.readFile(template, 'utf8', function(err, file){
	if(err){
	    //handle errors
	    console.log('error');
	    return res.send('error');
	}
	else {
	    var compiledTmpl = ejs.compile(file, {filename: template});	    
	    var html = compiledTmpl(context);

	    sendMail(email, subject, html, function(err, response){
		if(err){
		    flashError(err, req, res);
		}
		done();
	    });
	}
    });
}

var setToken = function(cb) {
    bcrypt.genSalt(10, function(err, salt) {
	cb(salt);
    });
}

var flashError = function(err, req, res) {
    var error = JSON.stringify(err);
    var parse = JSON.parse(error);
    console.log(err);
    req.flash('error', parse);
    res.redirect('/');
}

exports.index = function(req, res) {
    db.User.find({ where: { id: req.query.id }, include: [db.Subject] }).success(function(profile) {
        res.render('user', {
	    title: profile.firstName,
            profile: profile,
	    user: req.user,
        });
    }).error(function(err) {
	console.log(err);
	res.redirect('/');
    });
}

exports.create = function(req, res) {
    var reqx   = req.body
    , firstName = reqx.firstName
    , lastName  = reqx.lastName
    , email  = reqx.email

    var create = function() {
	setToken(function(token) {
	    db.User.create({ firstName: firstName, lastName: lastName, email: email, token: token }).success(function(user) {

		db.Role.find(2).success(function(role) { // NEED FIX "ID: 2". CHANGE TO A MORE GENERAL SOLUTION
		    user.addRole(role); 
		});

		getRootUrl(req, function(rootUrl) {

		    var subject = "Welcome to Illuminate";
		    var context = {
			token: token,
			url: rootUrl,
			title: subject,
			email: email
		    }

		    makeMail(req, res, email, 'emailVerify', subject, context, function() {
			res.render('verify', {
			    title: 'Hi ' + user.firstName + ', Welcome to Illuminate',
			});
		    });			
		});

	    }).error(function(err) {
		flashError(err, req, res);
	    });
	});
    }
    create();
}

exports.verify = function(req, res) {
    var token = req.query.token;
    db.User.find({ where: {token: token} }).success(function(user) {
        user.updateAttributes({
            active: true
        }).success(function() {
            res.redirect('/user/setup?token='+ token);
        }).error(function(err) {
	    console.log(err);
	});
    })
}

exports.askpass = function(req, res) {
    db.User.find({ where: { token: req.query.token } }).success(function(user) {
        if(user.pass != null) {
            res.redirect('/');
        }
        res.render('setup', {
            title: user.firstName,
            user: user,
        });
    });
}

exports.update = function(req, res) {

    Object.keys(req.body).forEach(function(key){

	if (key == 'tagsinput') {

	    console.log("tags input changed. case is '" + key + "'");

	    function getTagArrays(cb) {
		// create submitted tags array

		var sub  = req.body.tagsinput;
		var tags = [];

		var subSplit = sub.split(',');

		for(var i = 0; i < subSplit.length; i++) {
		    tags.push(subSplit[i]);
		}

		// create existing tags array

		var dbtags = [];

		db.User.find({ where: { id: req.user.id }, include: [ db.Subject ] }).success(function (user) {
		    var assocSubs = user.subjects;

		    async.map(assocSubs, function(assoc_obj, cb) {
			cb(null, assoc_obj.name);
		    }, function(err, results) {
			var dbtags = results;
			cb([tags, dbtags]);
		    });
		});
	    }

	    getTagArrays(function(arr) {

		var tags = arr[0];
		var dbtags = arr[1];

		console.log('now in the callback listener:');

		// compare the two and create subjects for tags that hve been submitted but not currently associated with the user 
		// and remove the association for tags that exist but have not been submitted in the form

		try {
		    if(tags.error) {
			res.send('error parsing json');
			return;
		    }

		    async.parallel([
			function(cb) {

			    var addTags = _.difference(tags, dbtags);

			    // Sequelize has a findOrCreate function i should probably use.
			    async.each(addTags, addSubject, function(err) {
			    	if(err) {
			    	    console.log(err);
			    	    res.send('error adding subjects');
			    	} else {
			    	    for(j = 0; j < addTags.length; j++) {
			    		db.Subject.find({ where: { name: addTags[j] } }).success(function(sub) {
			    		    sub.addUser(req.user).success(function() {});
			    		})
			    	    }
			    	}
			    });

			    cb(null);

			},
			function(cb) {

			    var rmTags = _.difference(dbtags, tags);

			    //should probably have a function that check if it's the last tag left of that kind in the db and rm it if it is
			    for(k = 0; k < rmTags.length; k++) {
				db.Subject.find({ where: { name: rmTags[k] } }).success(function(sub) {
				    sub.removeUser(req.user).success(function() {});
				})
			    }

			    cb(null);
			}
		    ]);

		} catch (error) {
		    console.log(error);
		    res.send('error parsing json');
		}
	    });
	} else if (req.body[key] && req.body[key] != req.user[key]) {

	    switch (key) {
	      case "email":
	      	console.log("email field changed. case is '" + key + "'");

	      	setToken(function(token) {

	      	    console.log(token);

	      	    getRootUrl(req, function(rootUrl) {

	      		var subject = 'Changed email';

	      		var context = {
	      		    url: rootUrl,
	      		    token: token,
	      		    title: subject,
			    email: req.body[key]
	      		}

	      		// need to make sure that there is some way of telling the difference between success and failure. when the makeMail function returns. may need to return a flash message
	      		makeMail(req, res, req.body[key], 'emailVerify', subject, context, function() {
	      		    res.render('verify', {
	      			title: subject,
	      			user: req.user,
	      		    });
	      		});
	      	    });
	      	});

	      	break;
	      case "oldpass":
		//do nothing
		break;
	      case "pass":
		console.log("password field changed. case is '" + key + "'");

		// make sure both fields are filled out and match
		if ( req.user.validPassword(req.body.oldpass) ) {
		    if ( req.body[key] == req.body.passconf ) {
			req.user[key] = req.user.generateHash(req.body[key]);
			// also need to throw a flash message.
		    }
		}
		// otherwise throw a no match error

		break;
	      case "passconf":
		// do nothing
		break;
	      default:
		console.log(req.user[key] + " is changed to " + req.body[key]);
		req.user[key] = req.body[key];
	    }
	}
    });

    req.user.save().success(function() {
	return;
    });

    req.flash('message', 'Profile updated successfully')
    res.redirect('/dash');
}

var addSubject = function(sub_nm, cb) {
    var subject = sub_nm;
    var Subject = db.Subject;
    Subject.find({ where: { name: subject } }).success(function(name_sub) {
	if(name_sub) {
	    cb();
	} else {
	    var new_sub = Subject.build({
		name: subject
	    });
	    new_sub.save().success(function() {
		cb();
	    }).error(function(err) {
		cb(err);
	    });
	}
    });
}
