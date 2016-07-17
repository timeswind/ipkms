module.exports = {
    isLoggedIn: function (req, res, next) {

        if (req.user) {
            return next();
        } else {
            res.status(401).send({
                permission: false,
                message: 'permission denied'
            });
        }

    },
    isStudent: function (req, res, next) {

        if (req.user.role == "student") {
            return next();
        } else {
            res.status(401).send({
                permission: false,
                message: 'permission denied'
            });
        }

    },
    isTeacher: function  (req, res, next) {
        if (req.user.role == "teacher") {
            return next();
        } else {
            res.status(401).send({
                permission: false,
                message: 'permission denied'
            });
        }
    },
    isAdmin: function (req, res, next) {
        if (req.user.role == "admin") {
            return next();
        } else {
            res.status(401).send({
                permission: false,
                message: 'permission denied'
            });
        }

    }
};