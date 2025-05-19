module.exports = function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
      const userRole = req.user?.role;
  
      if (!userRole || !allowedRoles.includes(userRole)) {
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
          //return res.redirect('/login');
          return res.status(403).json({ success: false, message: 'Access denied' });
        }
        //return res.redirect('/login');
        return res.status(403).render('unauthorized', { message: 'You are not authorized to view this page.' });
      }
  
      next();
    };
  };