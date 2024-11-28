const express = require('express');
const connectDB = require('./config/db');
const {backBlazeInit} = require('./functions/upload');


// Import Routes
const adminRoutes = require('./routes/adminRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const formRoutes = require('./routes/formRoutes');
const sitemapRoutes = require('./routes/sitemapRoutes'); // Додаємо новий маршрут
const cors = require('cors');

// Connect to MongoDB
connectDB();
backBlazeInit()
const app = express();
const PORT = process.env.PORT || 3313;

app.use(cors());

// Middleware to parse JSON
app.use(express.json());

// Home Route
app.get('/', (req, res) => {
  res.send('API Glorious!');
});

// Реєструємо новий маршрут для sitemap
app.use('/', sitemapRoutes); // Тут ми підключаємо sitemap маршрути


// Register Routes
app.use('/api/admins', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/submit-form', formRoutes);
// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
