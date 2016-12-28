// *** main dependencies *** //
var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var raven = require('raven');

// *** routes *** //
var apiRoutes = require('./routes/api.js');

// *** express instance *** //
var app = express();
app.use(raven.requestHandler('https://0f71c3e1e67d40908e4110a3392a0e51:e1216abeb8c5409cadae45624fc51b0e@sentry.io/103012'));

// *** config middleware *** //
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, '../client/public')));

// *** main routes *** //
app.use('/api', apiRoutes);

app.use(raven.errorHandler('https://0f71c3e1e67d40908e4110a3392a0e51:e1216abeb8c5409cadae45624fc51b0e@sentry.io/103012'));

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
