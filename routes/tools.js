var nodemailer = require('nodemailer');
var fs = require('fs');
var bcrypt = require('bcryptjs');
var ejs = require('ejs');

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

var sendMail = function(email, subject, content, next) {

    var mailOptions = {
        from: nmuser,
        to: email,
        subject: subject,
        html: content,
    }
    transporter.sendMail(mailOptions, next);
};

exports.setToken = function(cb) {
    bcrypt.genSalt(10, function(err, salt) {
        if(err) { console.log(err) }
	cb(salt);
    });
}

exports.getRootUrl = function(req, cb) {
    var rootUrl = req.protocol + '://' + req.get('host');
    cb(rootUrl);
}

exports.makeMail = function(req, res, email, templateFile, subject, context, done) {

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
                    console.log(err);
                }
                done();
            });
        }
    });
}
