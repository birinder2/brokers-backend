// middleware/auth.js
module.exports = {
    ensureAuth: (req, res, next) => {
        if (req.session.userId) {
            return next();
        }
        res.redirect('/');
    },
    ensureGuest: (req, res, next) => {
        if (!req.session.userId) {
            return next();
        }
        res.redirect('/dashboard');
    }
};
