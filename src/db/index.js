import dotenv from "dotenv";
import mongoose from "mongoose";
import { DB_name } from "../constants.js";

dotenv.config(); 

const connectDB = async () => {
  try {
    console.log("Loaded URI:", process.env.MONGODB_URI);
    console.log("FINAL URI:", `${process.env.MONGODB_URI}`);
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_name}`
    );

    console.log(`✅ MongoDB connected: ${connectionInstance.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectDB;
