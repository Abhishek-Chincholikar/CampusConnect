const mongoose = require('mongoose');

const connectDB = async () => {
  const { MONGO_URI } = process.env;

  if (!MONGO_URI) {
    throw new Error('MONGO_URI is required to start the API server.');
  }

  mongoose.set('strictQuery', true);

  const connection = await mongoose.connect(MONGO_URI, {
    autoIndex: process.env.NODE_ENV !== 'production',
  });

  console.log(`MongoDB connected: ${connection.connection.host}`);
  return connection;
};

module.exports = connectDB;
