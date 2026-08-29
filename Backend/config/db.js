// Backend/config/db.js
import mongoose from "mongoose";

async function connectDB() {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URI);
    console.log(
      `✅ MongoDB Connected: ${connection.connection.host}:${connection.connection.port}/${connection.connection.name}`
    );
    return connection;
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1);
  }
}

export default connectDB;