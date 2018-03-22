const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const ejsMate = require('ejs-mate');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('express-flash');
const passport = require('passport');

const routes = require('./routes');
const config = require('./secrets/configuration');

const app = express();

// Test Passport
require('./secrets/passport2.js')(passport);

// Middleware
app.use(express.static(__dirname + '/public'));
app.use('/admin-lte', express.static(__dirname + '/node_modules/admin-lte/dist/'));
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: config.secretKey
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(function(req, res, next) {
  res.locals.user = req.user;
  next();
});

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');

app.use('/', routes);

app.use((err, req, res, next) => {
  res.json(err);
});

module.exports = app;