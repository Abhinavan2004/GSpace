const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'MySuperSecretKey2024_ChangeThis_MustBe32CharsLong!';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required. No token provided.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid or expired token.' });
    }
    // user payload can be string or object (username or { id, username })
    const username = typeof user === 'string' ? user : (user.sub || user.username);
    const userId = user.id || null;

    req.user = { id: userId, username };
    next();
  });
}

module.exports = { authenticateToken, JWT_SECRET };
