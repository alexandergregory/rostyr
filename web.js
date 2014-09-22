var async        = require('async')
  , express      = require('express')
  , session      = require('express-session')
  , layouts      = require('express-ejs-layouts')
  , bodyParser   = require('body-parser')
  , cookieParser = require('cookie-parser')
  , morgan       = require('morgan')
  , flash        = require('connect-flash')
  , fs           = require('fs')
  , passport     = require('passport')
  , http         = require('http')
  , https        = require('https')
  , db           = require('./models')
  ;

require('./config/passport')(passport); // pass passport for configuration

var app = express();
var router = express.Router();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.set('layout', 'layout');
app.set("layout extractScripts", true)
app.set('port', process.env.PORT || 8080);

app.use(express.static(__dirname + '/public'));
app.use(layouts);

app.use(morgan('dev'));

app.use(cookieParser('secret'));
app.use(session({ cookie: { maxAge: 6000000 }, 
		  secret: 'secret', 
                  saveUninitialized: true,
                  resave: true }));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

require('./router.js')(app, router, passport);

// sync the database and start the server
db.sequelize.sync().complete(function(err) {
  if (err) {
    throw err;
  } else {
    http.createServer(app).listen(app.get('port'), function() {
      console.log("Listening on " + app.get('port'));
    });
  }
});
