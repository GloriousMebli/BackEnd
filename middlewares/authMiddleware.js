const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const authenticate = async (request, h) => {
  const authorization = request.headers.authorization;

  if (!authorization) {
    return h.response({ message: 'Authorization token is missing' }).code(401).takeover();
  }

  const token = authorization.split(' ')[1]; // Extract the token from the header

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    request.user = decoded; // Attach user info to the request
    return h.continue; // Continue to the next handler
  } catch (error) {
    return h.response({ message: 'Invalid token' }).code(401).takeover();
  }
};

module.exports = authenticate;
