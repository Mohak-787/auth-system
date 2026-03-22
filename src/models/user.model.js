import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Username is required"],
    trim: true,
    unique: [true, "Username must be unique"]
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    trim: true,
    unique: [true, "Email must be unique"]
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    trim: true
  },
  verified: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
export default User;