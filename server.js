const bodyParser = require('body-parser');
const compression = require('compression');
const exphbs = require('express-handlebars');
const express = require('express');
const helmet = require('helmet');
const mongoose = require('mongoose');
const passport = require('passport');
const routes = require('./app/routes/index.js');
const session = require('express-session');

const app = express();
require('dotenv').config();
require('./app/config/passport')(passport);

mongoose.connect(process.env.NODE_ENV === 'test' ?
    process.env.TEST_MONGO_URI : process.env.MONGO_URI,
{useNewUrlParser: true});

mongoose.Promise = global.Promise;

app.use(compression());
app.use(helmet.hidePoweredBy());
app.use(helmet.xssFilter());
app.use(helmet.noSniff());
app.use(helmet.ieNoOpen());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true,
}));

app.engine('handlebars', exphbs({
  defaultLayout: 'main',
}));
app.set('view engine', 'handlebars');


app.use('/public', express.static(process.cwd() + '/public'));
app.use('/favicon.ico', express.static('images/favicon.ico'));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

routes(app, passport);

const port = process.env.PORT || 8080;
app.listen(port, function() {
  console.log('Listening on port ' + port + '...');
});

module.exports = app;
