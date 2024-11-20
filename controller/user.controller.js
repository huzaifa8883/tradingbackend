import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apierror.js";
import { User } from "../models/user.js";
import { ApiResponse } from "../utils/apiresponse.js";
import crypto from "crypto";
import nodemailer from "nodemailer";





const generateAccessAndRefereshTokens = async(userId) =>{
  try {
    // Fetch user from the database
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Generate access and refresh tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Save refresh token in the database
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Token Generation Error:", error.message);
    throw new ApiError(500, error.message || "Error while generating tokens");
  }
}

const registerUser = asyncHandler(async (req, res) => {
  const {
    username,
    fullname,
    email,
    company,
    phone,
    password,
    country,
    state,
    postalCode,
    phoneExtension,
    city,
    address,
    address2,
    
  } = req.body;

  // Validate required fields
  if (![username, fullname, email, company, password, phone, country, state, postalCode, city, address,address2].some(field => field?.trim() !== "")) {
    throw new ApiError(400, "All fields are required");
  }

  // if (!/\S+@\S+\.\S+/.test(email)) {
  //   throw new ApiError(400, "Valid email is required");
  // }

  const existedUser = await User.findOne({
    $or: [{ email: email || null }, { username: username || null }]
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  const user = await User.create({
    username,
    fullname,
    phone,
    company,
    email,
    password,
    country,
    state,
    postalCode,
    phoneExtension,
    city,
    address,
    address2,
   
  });

  const createdUser = await User.findById(user._id).select("-password -refreshToken");

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered successfully")
  );
});


const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    throw new ApiError(400, "Username or email is required");
  }

  const user = await User.findOne({
    $or: [{ email }, { username: email }]
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.ispasswordcorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id);

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  const options = {
    httpOnly: true,
 secure: process.env.NODE_ENV === "production",
 sameSite: "none",
 maxAge: 24 * 60 * 60 * 1000,
};
  

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, // this removes the field from document
      },
    },
    {
      new: true,
    }
  );

  const options = {
       httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});
const userStatus = asyncHandler(async (req, res) => {
    // Assuming the user is already authenticated based on access token in cookies
    const userId = req.user._id; // user info should be available via middleware
 
  
    // Find the user by ID
    const user = await User.findById(userId).select("-password -refreshToken");
    
    if (!user) {
      throw new ApiError(404, "User not found");
    }
  
    // Determine the user's status (could be more complex based on application needs)
    const status = user.isActive ? "Active" : "Inactive"; // Example of a basic status check
  
    return res.status(200).json(
      new ApiResponse(200, { user, status }, "User status retrieved successfully")
    );
  });
  // Route: GET /api/users/:userId
const getUserDetails = asyncHandler(async (req, res) => {
    const { userId } = req.params; // Extract user ID from route parameter
  
    // Check if userId is valid
    if (!userId) {
      throw new ApiError(400, "User ID is required");
    }
  
    // Find the user by ID and exclude sensitive fields
    const user = await User.findById(userId).select("-password -refreshToken");
  
    // If the user doesn't exist, return an error
    if (!user) {
      throw new ApiError(404, "User not found");
    }
  
    return res.status(200).json(
      new ApiResponse(200, user, "User details retrieved successfully")
    );
  });
  // Route: GET /api/users
const getAllUsers = asyncHandler(async (req, res) => {
    // Find all users excluding password and refreshToken fields
    const users = await User.find().select("-password -refreshToken");
  
    // If no users are found, return a message
    if (!users.length) {
      throw new ApiError(404, "No users found");
    }
  
    return res.status(200).json(
      new ApiResponse(200, users, "All users details retrieved successfully")
    );
  });
  
  const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
  
    // Validate email
    if (!email) {
      throw new ApiError(400, "Email is required");
    }
  
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(404, "User not found");
    }
  
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save({ validateBeforeSave: false });
  
    // Reset URL (adjust the frontend route accordingly)
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request",
      html: `<p>You requested a password reset. Click the link below to reset your password:</p>
             <a href="${resetUrl}">${resetUrl}</a>
             <p>If you did not request this, please ignore this email.</p>`,
    };
  
    // Send email
    const transporter = nodemailer.createTransport({
      service: "gmail", // Or your preferred email provider
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  
    try {
      await transporter.sendMail(mailOptions);
      res.status(200).json(
        new ApiResponse(
          200,
          null,
          "Password reset email sent successfully"
        )
      );
    } catch (error) {
      console.error("Error sending email:", error);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });
  
      throw new ApiError(500, "Error sending email. Try again later");
    }
  });

export { registerUser, loginUser, logoutUser,userStatus,getAllUsers,getUserDetails,forgotPassword };


