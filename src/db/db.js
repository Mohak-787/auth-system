import mongoose from "mongoose";

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not defined in environment variables")
  }

  const conn = await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to DB: ", conn.connection.host);
}

export default connectDB;