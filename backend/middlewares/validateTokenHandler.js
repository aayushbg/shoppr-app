const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");

const validateToken = asyncHandler(async (req, res, next) => {
    let token;
    const authToken = req.headers.authorization || req.headers.Authorization;
    if(authToken && authToken.startsWith("Bearer")){
        token = authToken.split(" ")[1];
        jwt.verify(token, process.env.ACCESS_KEY_SECRET, (err, decoded) => {
            if(err){
                res.status(400);
                throw new Error("User is not authorized");
            }
            req.admin = decoded.admin;
            next();
        });
    }
    else{
        res.status(400);
        throw new Error("User is not authorized");
    }
});

module.exports = validateToken;