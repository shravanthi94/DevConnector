const jwt = require("jsonwebtoken");
const config = require("config");

module.exports = (req, res, next) => {
  // Get the requested web token from request header
  const token = req.header("x-auth-token");

  if (!token) {
    res.status(401).json({ msg: "No token, authorization denied" });
  }

  // Decode the web token and verify
  try {
    const decoded = jwt.verify(token, config.get("jwtSecret"));
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: "Token is invalid" });
  }
};
