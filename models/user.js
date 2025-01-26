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
    withdrawpin: {   
      type: String,
      required: true,  
    },
    
    // Added address-related fields
    
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    deposit: {
      usdt: { type: Number, default: 0 }, // Default deposit in USDT
      trx: { type: Number, default: 0 }, // Default deposit in TRX
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

userschema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      username: this.username,
      fullname: this.fullname,
      email: this.email,
    withdrawpin:this.withdrawpin
    },
    process.env.ACCESS_TOKEN_SECRET,
     { expiresIn: "1h" }
  );
};

// Generate a refresh token
userschema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { _id: this._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
};
userschema.methods.updateDeposit = async function (currency, amount) {
  if (currency === "usdt") {
    // Check if deduction is valid
    if (amount < 0 && this.deposit.usdt < Math.abs(amount)) {
      throw new Error("Insufficient USDT balance");
    }
    this.deposit.usdt += amount;
  } else if (currency === "trx") {
    // Check if deduction is valid
    if (amount < 0 && this.deposit.trx < Math.abs(amount)) {
      throw new Error("Insufficient TRX balance");
    }
    this.deposit.trx += amount;
  } else {
    throw new Error("Unsupported currency");
  }

  // Save changes to the database
  await this.save();
};

export const User = mongoose.model("User", userschema);
