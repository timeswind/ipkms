'use strict';
var express = require('express');
var router = express.Router();
var qiniu = require('qiniu');

var privateSettings = require("../../Private-settings");
//七牛key
qiniu.conf.ACCESS_KEY = privateSettings.QINIU_ACCESS_KEY;
qiniu.conf.SECRET_KEY =  privateSettings.QINIU_SECRET_KEY;

var validUserRole = require("../../auth/validUserRole");
var isLoggedIn = validUserRole.isLoggedIn;

//获取小组的最近的20条消息
router.route('/uptoken')
    .get(isLoggedIn, function (req, res) {
        var myUpToken = new qiniu.rs.PutPolicy(privateSettings.QINIU_PIC_POLICY);
        var token = myUpToken.token();
        res.header("Cache-Control", "max-age=0, private, must-revalidate");
        res.header("Pragma", "no-cache");
        res.header("Expires", 0);
        if (token) {
            res.json({
                uptoken: token
            });
        }
    });

module.exports = router;
