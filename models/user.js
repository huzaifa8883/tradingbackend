import { Schema } from "mongoose";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userschema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {  // Added username field
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    fullname: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    refreshToken: {
      type: String,
    },
    phone: {   
      type: String,
      required: true,  
    },
    company: {  
      type: String,
      required: true,  
    },
    // Added address-related fields
    country: {
      type: String,
      required: true,  // You can make it required based on your use case
    },
    state: {
      type: String,
      required: true,  // You can make it required based on your use case
    },
    postalCode: {
      type: String,
      required: true,  // You can make it required based on your use case
    },
    phoneExtension: {
      type: String,
      required: false,  // Optional
    },
    city: {
      type: String,
      required: true,  // You can make it required based on your use case
    },
    address: {
      type: String,
      required: true,  // You can make it required based on your use case
    },
    address2: {
      type: String,
      required: true,  // You can make it required based on your use case
    },
   
  },
  { timestamps: true }
);

userschema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userschema.methods.ispasswordcorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userschema.methods.generateaccesstoken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,  // Include username in the token
      fullname: this.fullname,
      phone: this.phone,  
      company: this.company,
      country: this.country,   // Include address data in the token
      state: this.state,
      postalCode: this.postalCode,
      phoneExtension: this.phoneExtension,
      city: this.city,
      address: this.address,
      address2: this.address2,
     
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

userschema.methods.generaterefreshshtoken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFERSH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFERSH_TOKEN_EXPIRY,
    }
  );
};

export const User = mongoose.model("User", userschema);
