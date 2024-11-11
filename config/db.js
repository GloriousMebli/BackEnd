const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    // Determine the MongoDB URI based on NODE_ENV
    const mongoURI = process.env.NODE_ENV === 'LOCAL_DEV' 
      ? 'mongodb://localhost:27017/glorious-local' 
      : process.env.MONGO_URI;

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB connected to ${mongoURI}`);
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
