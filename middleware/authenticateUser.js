const jwt = require('jsonwebtoken');
const User = require('../models/user'); // Import the User model
const JWT_SECRET = process.env.JWT_SECRET || 'secret-key';

const authenticateUser = async (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ error: 'Authentication failed - Token not provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'Authentication failed - User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ error: 'Authentication failed - Invalid token' });
  }
};

module.exports = authenticateUser;
