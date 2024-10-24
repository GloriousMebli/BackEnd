const Hapi = require('@hapi/hapi');
const connectDB = require('./config/db');

// Import Routes
const adminRoutes = require('./routes/adminRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

// Connect to MongoDB
connectDB();

const init = async () => {
  const server = Hapi.server({
    port: 3313,
    host: '0.0.0.0',
  });

  // Register Routes
  server.route(adminRoutes);
  server.route(productRoutes);
  server.route(categoryRoutes);

  await server.start();
  console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});

init();
