// test-db.js
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config(); // Load variables from .env

async function testConnection() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not set in .env");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connection successful!");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

testConnection();