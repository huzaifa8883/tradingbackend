import { ApiError } from "../utils/apierror.js";
import { asyncHandler } from "../utils/asynchandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.js";

export const verifyJWT = asyncHandler(async(req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
      

        if (!token) {
            // Ensure you handle missing token scenario properly
            throw new ApiError(401, "Authorization token must be provided");
        }

        // Verify JWT token
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        console.log(decodedToken)

        // Find user by decoded token ID
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

        if (!user) {
            // Handle case where user doesn't exist
            throw new ApiError(401, "Invalid Access Token");
        }

        // Attach user to the request object for use in later middleware or route handlers
        req.user = user;
        
        next();
    } catch (error) {
        // Handle specific JWT errors
        if (error instanceof jwt.JsonWebTokenError) {
            throw new ApiError(401, "Invalid or expired token");
        }

        if (error instanceof jwt.TokenExpiredError) {
            throw new ApiError(401, "Token has expired");
        }

        // General error handling
        throw new ApiError(401, error?.message || "Invalid access token");
    }
});
