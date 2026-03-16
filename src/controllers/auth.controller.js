import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";

/**
 * - Auth register controller
 * - POST /api/auth/register
 */
export const register = async (req, res) => {
  const { username, email, password } = req.body;

  const isAlreadyRegistered = await User.findOne({
    $or: [
      { username }, { email }
    ]
  });

  if (isAlreadyRegistered) {
    return res.status(409).json({
      message: "Username or email already exists"
    });
  }

  const hashedPassword = crypto.createHash("sha256").update(password).digest('hex');

  const user = await User.create({
    username,
    email,
    password: hashedPassword
  });

  const userObj = user.toJSON();
  delete userObj['password'];

  const token = jwt.sign({
    id: userObj._id
  }, process.env.JWT_SECRET, { expiresIn: "1d" });

  res.status(201).json({
    message: "User registered successfully",
    user: userObj,
    token
  });
}