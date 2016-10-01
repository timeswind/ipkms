var redisClient = require('./redis_database').redisClient;
var jwt = require('jsonwebtoken');
var fs = require('fs');
var publicKey = fs.readFileSync('ipkms.rsa.pub');
var privateKey = fs.readFileSync('ipkms.rsa');
var TOKEN_EXPIRATION = 60*24;
var TOKEN_EXPIRATION_SEC = TOKEN_EXPIRATION * 60;

// Middleware for token verification
exports.verifyToken = function (req, res, next) {
  var token = getToken(req);

  if (token) {
    redisClient.get(token, function (err, reply) {
      if (err) {
        console.log(err);
        return res.status(401).send({
          authorize: false,
          message: '认证失败'
        });
      }
      if (reply) {
        console.log("Token is expired because the user logged out");
        res.status(401).send({
          authorize: false,
          message: '认证失败'
        });
      } else {
        jwt.verify(token, publicKey, { algorithms: ['RS256'] }, function (err, decoded) {
          if (err) {
            return res.status(401).send({
              authorize: false,
              message: '认证失败'
            });
          } else {
            // if everything is good, save to request for use in other routes
            req.user = decoded;
            // console.log(decoded);
            next();
          }
        });
      }

    });
  } else {
    res.status(401).send({
      authorize: false,
      message: '认证失败'
    });
  }

};

exports.expireToken = function(req) {
  var token = getToken(req);

  if (token != null) {
    redisClient.set(token, { is_expired: true });
    redisClient.expire(token, TOKEN_EXPIRATION_SEC);
  }
};

exports.signToken = function(payload) {
  var token = jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    expiresIn: TOKEN_EXPIRATION_SEC // expires duration
  });
  return token
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
