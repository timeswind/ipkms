var redisClient = require('./redis_database').redisClient;
var TOKEN_EXPIRATION = 60*24;
var TOKEN_EXPIRATION_SEC = TOKEN_EXPIRATION * 60;

// Middleware for token verification
exports.verifyToken = function (req, res, next) {
  var token = getToken(req);

  redisClient.get(token, function (err, reply) {
    if (err) {
      console.log(err);
      return res.sendStatus(500);
    }

    if (reply) {
      console.log("redis checked that the token is expired because the user logged out");
      res.sendStatus(401);
    }
    else {
      next();
    }

  });
};

exports.expireToken = function(req) {
  var token = getToken(req);

  if (token != null) {
    redisClient.set(token, { is_expired: true });
    redisClient.expire(token, TOKEN_EXPIRATION_SEC);
  }
};

var getToken = function(req) {
  if (req.headers && req.body.token || req.query.token || req.headers['x-access-token']) {
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    return token;
  }
  else {
    return null;
  }
};

exports.TOKEN_EXPIRATION = TOKEN_EXPIRATION;
exports.TOKEN_EXPIRATION_SEC = TOKEN_EXPIRATION_SEC;
