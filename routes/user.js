var nodemailer = require('nodemailer');
var fs = require('fs');
var bcrypt = require('bcryptjs');
var async = require('async');
var _ = require('underscore');

var tools = require('./tools');
var db = require('../models');

exports.create = function(req, res) {

    var reqx   = req.body
    , firstName = reqx.firstName
    , lastName  = reqx.lastName
    , email  = reqx.email

    tools.setToken(function(token) {
	db.User.create({ firstName: firstName, lastName: lastName, email: email, token: token }).success(function(user) {

	    db.Role.find(2).success(function(role) { // NEED FIX "ID: 2". CHANGE TO A MORE GENERAL SOLUTION
		user.addRole(role); 
	    });

	    tools.getRootUrl(req, function(rootUrl) {

		var subject = "Welcome to Rostyr";
		var context = {
		    token: token,
		    url: rootUrl,
		    title: subject,
		    email: email
		}

		tools.makeMail(req, res, email, 'emailVerify', subject, context, function() {
		    res.render('verify', {
			title: 'Hi ' + user.firstName + ', Welcome to Rostyr',
			user: req.user,
		    });
		});			
	    });

	}).error(function(err) {
	    console.log(err);
	});
    });

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

	if (req.body[key] && req.body[key] != req.user[key]) {

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
	      		tools.makeMail(req, res, req.body[key], 'emailVerify', subject, context, function() {
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

    req.flash('message', 'Profile updated successfully');
    res.redirect('/dash');
}
