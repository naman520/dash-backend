const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ success : false , error : 'No Token' });

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user =  decoded;
        next();
    }catch{
        return res.status(401).json({ success : false, error : "Invalid token" })
    }
}

module.exports = verifyToken;