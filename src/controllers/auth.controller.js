import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import Session from "../models/session.model.js";

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

  const refreshToken = jwt.sign({
    id: userObj._id
  }, process.env.JWT_SECRET, { expiresIn: "7d" });

  const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

  const session = await Session.create({
    user: userObj._id,
    refreshTokenHash,
    ip: req.ip,
    userAgent: req.headers["user-agent"]
  });

  const accessToken = jwt.sign({
    id: userObj._id,
    sessionId: session._id
  }, process.env.JWT_SECRET, { expiresIn: "15m" });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.status(201).json({
    message: "User registered successfully",
    user: userObj,
    accessToken
  });
}

/**
 * - Auth login controller
 * - POST /api/auth/login
 */
export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(401).json({
      message: "Invalid credentials"
    });
  }

  const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");
  const isPasswordValid = hashedPassword === user.password;

  if (!isPasswordValid) {
    return res.status(401).json({
      message: "Invalid credentials"
    });
  }

  const userObj = user.toJSON();
  delete userObj['password'];

  const refreshToken = jwt.sign({
    id: userObj._id
  }, process.env.JWT_SECRET, { expiresIn: "7d" });

  const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

  const session = await Session.create({
    user: userObj._id,
    refreshTokenHash,
    ip: req.ip,
    userAgent: req.headers["user-agent"]
  });

  const accessToken = jwt.sign({
    id: userObj._id,
    sessionId: session._id
  }, process.env.JWT_SECRET, { expiresIn: "15m" });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.status(200).json({
    message: "User logged in successfully",
    user: userObj,
    accessToken
  });
}

/**
 * - Auth getUser controller
 * - GET /api/auth/get-user
 */
export const getUser = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Token not found"
    });
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }

  const user = await User.findById(decodedToken.id).select("-password");

  res.status(200).json({
    message: "User fetched successfully",
    user: user
  });
}

/**
 * - Auth refreshToken controller
 * - GET /api/auth/refresh-token
 */
export const refreshToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      message: "Token not found"
    });
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(refreshToken, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({
      message: "Invalid or expired refresh token"
    });
  }

  const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest('hex');

  const session = await Session.findOne({
    refreshTokenHash,
    revoked: false
  });

  if (!session) {
    return res.status(401).json({
      message: "Invalid refresh token"
    });
  }

  const accessToken = jwt.sign({
    id: decodedToken.id
  }, process.env.JWT_SECRET, { expiresIn: "15m" });

  const newRefreshToken = jwt.sign({
    id: decodedToken.id
  }, process.env.JWT_SECRET, { expiresIn: "7d" });

  const newRefreshTokenHash = crypto.createHash("sha256").update(newRefreshToken).digest('hex');

  session.refreshTokenHash = newRefreshTokenHash;
  await session.save();

  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.status(200).json({
    message: "Access token generated successfully",
    accessToken
  });
}

/**
 * - Auth logout controller
 * - POST /api/auth/logout
 */
export const logout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(400).json({
      message: "Refresh token not found"
    });
  }

  const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

  const session = await Session.findOne({
    refreshTokenHash,
    revoked: false
  });

  if (!session) {
    return res.status(401).json({
      message: "Invalid refresh token"
    });
  }

  session.revoked = true;
  await session.save();

  res.clearCookie('refreshToken');

  res.status(200).json({
    message: "Logged out successfully"
  });
}

/**
 * - Auth logoutAll controller
 * - POST /api/auth/logout-all
 */
export const logoutAll = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      message: "Refresh token not found"
    });
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(refreshToken, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({
      message: "Invalid or expired refresh token"
    });
  }

  await Session.updateMany({
    user: decodedToken.id,
    revoked: false
  }, { revoked: true });

  res.status(200).json({
    message: "Logged out from all devices successfully"
  });
}