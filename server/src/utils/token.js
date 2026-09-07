const jwt = require('jsonwebtoken');

/**
 * Generate JWT token for user
 * @param {string} userId
 * @param {string} role
 * @returns {string}
 */
const generateToken = (userId, role) => {
  const secret = process.env.JWT_SECRET || 'hackathon_default_secret_key_change_in_production';
  const expiresIn = process.env.JWT_EXPIRE || '7d';

  return jwt.sign(
    { id: userId, role },
    secret,
    { expiresIn }
  );
};

/**
 * Verify JWT token
 * @param {string} token
 * @returns {object}
 */
const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET || 'hackathon_default_secret_key_change_in_production';
  return jwt.verify(token, secret);
};

module.exports = {
  generateToken,
  verifyToken
};
