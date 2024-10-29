const express = require('express');
const connectDB = require('./config/db');

// Import Routes
const adminRoutes = require('./routes/adminRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 3313;

// Middleware to parse JSON
app.use(express.json());

// Home Route
app.get('/', (req, res) => {
  res.send('Hello, Express deployed on Railway!');
});

// Register Routes
app.use('/api/admins', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
