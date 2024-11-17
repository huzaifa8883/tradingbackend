import jwt from "jsonwebtoken";
import { ApiError } from "../utils/apierror.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { User } from "../models/user.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      console.log("Authorization header is missing");
      throw new ApiError(401, "Unauthorized request: No Authorization header provided");
    }
    
    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    // Verify JWT token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Find user by decoded token ID
    const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

    if (!user) {
      throw new ApiError(401, "Invalid Access Token: User not found");
    }

    // Attach user to the request object for use in later middleware or route handlers
    req.user = user;

    next();
  } catch (error) {
    // Suppress console logs except in debug mode
    if (process.env.NODE_ENV === "development") {
      console.error("Authentication Error:", error.message);
    }

    // Handle specific JWT errors
    if (error instanceof jwt.JsonWebTokenError) {
      throw new ApiError(401, "Invalid or expired token");
    }

    if (error instanceof jwt.TokenExpiredError) {
      throw new ApiError(401, "Token has expired");
    }

    // General error handling
    throw new ApiError(401, "Unauthorized request");
  }
});
