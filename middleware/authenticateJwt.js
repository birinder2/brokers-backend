const jwt = require("jsonwebtoken");
const salesman = require("../models/Salesman");
const User = require("../models/User");
const BackendUserLogin = require("../models/BackendUserLogin");


// const authenticateJWT = (req, res, next) => {
// 	const authHeader = req.cookies.token;
// 	if (authHeader) {
// 	  jwt.verify(authHeader, process.env.TOKEN_KEY, (err, user) => {
// 		if (err) {
// 		  return res.redirect('/');
// 		}

//         const user = await salesman.findById(userId);
//         if(!user){
//             throw new Error("Invalide token");
//         }
// 		req.users = user;
// 		next();
// 	  });
// 	} else {
// 	  return res.redirect('/');
// 	}
// };

const authenticateJWT = async (req,res,next) => {
    try {
        const authHeader = req.cookies.broker_token;
        if(!authHeader){
            res.clearCookie("broker_token");
            if (req.session) req.session.destroy();
            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            
            return res.redirect('/');
        }

        //let decode = await jwt.verify(authHeader,process.env.TOKEN_KEY);
        let decode = await verifyTokenAsync(authHeader, process.env.TOKEN_KEY);

        const userId = decode.backendId;
        const user = await BackendUserLogin.findById(userId);
        if(!user){
            res.clearCookie("broker_token");
            if (req.session) req.session.destroy();
            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.status(401).json({ success: false, message: 'User not found' });
            }
            return res.redirect('/');
        }
        req.user = user;
        req.user.salesmanId = decode.brokerId;
        next();

    } catch (error) {
        console.error("Error in authenticateJWT", error);
        res.clearCookie("developer_token");
        if (req.session) req.session.destroy();
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(401).json({ success: false, message: 'Invalid or expired token' });
        }
        return res.redirect('/');
    }

}

function verifyTokenAsync(token, secret) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded);
    });
  });
}



module.exports = authenticateJWT;