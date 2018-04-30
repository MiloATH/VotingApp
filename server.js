var express = require('express');
var routes = require('./app/routes/index.js');
var mongoose = require('mongoose');
var passport = require('passport');
var exphbs = require('express-handlebars');
var session = require('express-session');
var bodyParser = require('body-parser');
var helmet = require('helmet');
var compression = require('compression');

var app = express();
require('dotenv').load();
require('./app/config/passport')(passport);

mongoose.connect(process.env.NODE_ENV === 'test' ?
    process.env.TEST_MONGO_URI : process.env.MONGO_URI);

mongoose.Promise = global.Promise;

app.use(compression());

app.use(helmet.hidePoweredBy());
app.use(helmet.xssFilter());
app.use(helmet.noSniff());
app.use(helmet.ieNoOpen());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.engine('handlebars', exphbs({
    defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');


app.use('/public', express.static(process.cwd() + '/public'));
app.use('/favicon.ico', express.static('images/favicon.ico'));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

routes(app, passport);

var port = process.env.PORT || 8080;
app.listen(port, function() {
    console.log('Listening on port ' + port + '...');
});

module.exports = app;
