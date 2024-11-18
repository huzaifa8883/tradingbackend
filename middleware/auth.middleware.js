import jwt from "jsonwebtoken";
import { ApiError } from "../utils/apierror.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { User } from "../models/user.js";

const extractToken = (authHeader) => {
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }
  return null;
};

export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new ApiError(401, "Missing Authorization header");
    }

    const token = extractToken(authHeader);

    if (!token) {
      throw new ApiError(401, "Invalid Authorization header format");
    }

    // Verify JWT token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    let user;
    try {
      user = await User.findById(decodedToken?._id).select("-password -refreshToken");
    } catch (err) {
      throw new ApiError(500, "Internal Server Error: Unable to fetch user");
    }

    if (!user) {
      throw new ApiError(401, "Invalid Access Token: User not found");
    }

    // Attach user to request
    req.user = user;

    next();
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Authentication Error:", error.message);
    }

    if (error instanceof jwt.JsonWebTokenError) {
      throw new ApiError(401, "Invalid or expired token");
    }

    if (error instanceof jwt.TokenExpiredError) {
      throw new ApiError(401, "Token has expired");
    }

    throw new ApiError(401, "Unauthorized request");
  }
});
