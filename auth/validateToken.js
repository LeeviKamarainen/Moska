const  jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    const authHeader = req.headers["authorization"];
    console.log(authHeader)
    let token;
    if(authHeader) {
        token = authHeader.split(" ")[1];
    }
    else {
        token = null;
    }
    if(token == null) return res.sendStatus(401);
    console.log("Token found")
    jwt.verify(token, process.env.SECRET, (err, auth) => {
        if(err) {
            req.auth = false;
            next();
        };
        req.auth = true;
        next();
    })
};