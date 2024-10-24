const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = [
  {
    method: 'POST',
    path: '/api/admins',
    handler: async (request, h) => {
      const { email, password, name } = request.payload;
      
      try {
        const admin = new Admin({ email, password, name });
        await admin.save();
        return h.response({ message: 'Admin created' }).code(201);
      } catch (error) {
        return h.response({ error: error.message }).code(400);
      }
    },
  },

  {
    method: 'POST',
    path: '/api/admins/login',
    handler: async (request, h) => {
      const { email, password } = request.payload;

      try {
        const admin = await Admin.findOne({ email });
        if (!admin) {
          return h.response({ error: 'Invalid credentials' }).code(400);
        }

        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
          return h.response({ error: 'Invalid credentials' }).code(400);
        }

        const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        return h.response({ message: 'Logged in successfully', token }).code(200);
      } catch (error) {
        return h.response({ error: error.message }).code(500);
      }
    },
  },

  {
    method: 'POST',
    path: '/api/admins/verify-token',
    handler: async (request, h) => {
      const token = request.headers.authorization?.split(' ')[1];

      if (!token) {
        return h.response({ error: 'No token provided' }).code(401);
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return h.response({ message: 'Token is valid', valid: true, userId: decoded.id }).code(200);
      } catch (error) {
        return h.response({ error: 'Invalid token' }).code(401);
      }
    },
  },
];
