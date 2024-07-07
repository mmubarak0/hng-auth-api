const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({
    status: "Bad Request",
    message: "Access Denied.",
    statusCode: 401,
  });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({
      status: "Bad Request",
      message: "Invalid Token",
      statusCode: 401,
    });
  }
};

module.exports = verifyToken;
