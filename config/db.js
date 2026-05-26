const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI || 'undefined';
    
    // Clean up potential copy-paste prefix errors in the env variable
    uri = uri.trim();
    if (uri.startsWith('MONGODB_URI=')) {
      uri = uri.substring('MONGODB_URI='.length).trim();
    } else if (uri.startsWith('MONGO_URI=')) {
      uri = uri.substring('MONGO_URI='.length).trim();
    }
    
    // Strip surrounding quotes if any
    if ((uri.startsWith('"') && uri.endsWith('"')) || (uri.startsWith("'") && uri.endsWith("'"))) {
      uri = uri.slice(1, -1).trim();
    }

    // Mask password for safety in logs
    const maskedUri = uri.replace(/:([^:@]+)@/, ':******@');
    console.log(`Connecting to MongoDB URI: ${maskedUri}`);
    
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000 // Timeout after 5s instead of 30s
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // Do not crash the server in development, but print warning
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
