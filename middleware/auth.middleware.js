import { ApiError } from "../utils/apierror.js";
import { asyncHandler } from "../utils/asynchandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.js";

export const verifyJWT = asyncHandler(async(req, _, next) => {
    try {
          const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
        //  || req.header("Authorization")?.replace("Bearer ", "")
        
console.log("Extracted Token:",token);

         console.log(token);
        if (!token) {
            throw new ApiError(401, "Unauthorized request")
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
