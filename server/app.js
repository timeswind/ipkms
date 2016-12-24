// *** main dependencies *** //
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
// var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var swig = require('swig');
var mongoose = require('mongoose');
var raven = require('raven');

// *** routes *** //
var routes = require('./routes/index.js');
var apiRoutes = require('./routes/api.js');
var homeRoutes = require('./routes/home.js');


// *** express instance *** //
var app = express();
app.use(raven.middleware.express.requestHandler('https://0f71c3e1e67d40908e4110a3392a0e51:e1216abeb8c5409cadae45624fc51b0e@sentry.io/103012'));

// *** view engine *** //
var swig = new swig.Swig();
app.engine('html', swig.renderFile);
app.set('view engine', 'html');


// *** static directory *** //
app.set('views', path.join(__dirname, 'views'));


// *** config middleware *** //
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../client/public')));

// Initialize Passport and restore authentication state, if any, from the
// session.

// *** main routes *** //
app.use('/', routes);
app.use('/api', apiRoutes);
app.use('/home', homeRoutes);


app.use(raven.middleware.express.errorHandler('https://0f71c3e1e67d40908e4110a3392a0e51:e1216abeb8c5409cadae45624fc51b0e@sentry.io/103012'));


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// *** error handlers *** //

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: "Servise unavailable",
    error: {}
  });
});




module.exports = app;
