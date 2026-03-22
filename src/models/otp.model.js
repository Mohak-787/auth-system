import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Email is required"]
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  otpHash: {
    type: String,
    required: [true, "Otp hash is required"]
  }
}, { timestamps: true });

const Otp = mongoose.model('Otp', otpSchema);
export default Otp;