import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apierror.js";
import { ApiResponse } from "../utils/apiresponse.js";
import { Order } from "../models/order.js";

// Create a new order
const createOrder = asyncHandler(async (req, res) => {
  const {
    designName,
    format,
    location,
    file,
    fileUrl,
    height,
    width,
    colorName,
    numberOfColors,
    fabric,
    expectedDelivery,
    comments,
    isRush, // Get rush status from request body
    price,  // Use the exact price from the frontend
    paymentStatus, // Add payment status to the request body
  } = req.body;

  // Assuming userId is stored in req.user.id after authentication middleware
  const userId = req.user.id;

  // Validate input fields
  if (![designName, location, height, width, colorName, numberOfColors, fabric, expectedDelivery].every(field => field?.trim() !== "")) {
    throw new ApiError(400, "All required fields must be filled");
  }

  // Validate payment status if provided
  if (paymentStatus && !['Pending', 'Success', 'Failed'].includes(paymentStatus)) {
    throw new ApiError(400, "Invalid payment status. It must be 'Pending', 'Success', or 'Failed'.");
  }

  // Create a new order including the paymentStatus field
  const newOrder = await Order.create({
    userId,
    designName,
    format,
    location,
    file,
    fileUrl,
    height,
    width,
    colorName,
    numberOfColors,
    fabric,
    expectedDelivery,
    comments,
    isRush,
    price,
    status: "Pending",  // Default status
    paymentStatus: paymentStatus || 'Pending',  // Default to 'Pending' if no payment status provided
  });

  // If the order creation fails, throw an error
  if (!newOrder) {
    throw new ApiError(500, "Something went wrong while creating the order");
  }

  return res.status(201).json(
    new ApiResponse(200, newOrder, "Order created successfully")
  );
});






// Get individual order details by order ID
// Get all order details for a specific user
const getUserOrders = asyncHandler(async (req, res) => {
  const userId = req.user.id; // Get the user ID from the authentication middleware

  // Find orders by the authenticated userId
  const orders = await Order.find({ userId });

  // If no orders are found for the user, return an empty array
  if (orders.length === 0) {
    return res.status(404).json(
      new ApiResponse(404, [], "No orders found for this user")
    );
  }

  return res.status(200).json(
    new ApiResponse(200, orders, "User orders retrieved successfully")
  );
});

// Get all order details
const getAllOrders = asyncHandler(async (req, res) => {
  // Retrieve all orders from the database where status is 'Pending'
  const orders = await Order.find({ status: "Pending" });

  // If no orders are found, return an empty array
  if (orders.length === 0) {
    return res.status(404).json(
      new ApiResponse(404, [], "No pending orders found")
    );
  }

  return res.status(200).json(
    new ApiResponse(200, orders, "All pending orders retrieved successfully")
  );
});

const getCompletedOrders = asyncHandler(async (req, res) => {
  // Retrieve all orders from the database where status is 'Completed'
  const completedOrders = await Order.find({ status: "Completed" });

  
  

  return res.status(200).json(
    new ApiResponse(200, completedOrders, "All completed orders retrieved successfully")
  );
});

const sendFilesAndCompleteOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { fileUrls } = req.body;  // Expect an array of URLs from the frontend

  // Find the order by ID
  const order = await Order.findById(orderId);
  

  // Check if userFiles is already an array; if not, initialize it as an array
  order.userFiles = Array.isArray(order.userFiles) ? order.userFiles : [];

  // Append new URLs to userFiles or replace them entirely, depending on your preference
  order.userFiles = [...order.userFiles, ...fileUrls]; // Append new URLs

  // Update the order status and mark fileSent as true
  order.fileSent = true;
  order.status = 'Completed';

  // Save the updated order
  await order.save();

  return res.status(200).json(new ApiResponse(200, order, "Order completed and file sent"));
});

const updatePaymentStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;  // Get order ID from URL parameter
  const { paymentStatus } = req.body;  // Get new payment status from request body

  // Validate the payment status
  if (!paymentStatus || !['Pending', 'Success', 'Failed'].includes(paymentStatus)) {
    throw new ApiError(400, "Invalid payment status. It must be 'Pending', 'Success', or 'Failed'.");
  }

  // Find the order by ID
  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json(new ApiResponse(404, null, "Order not found"));
  }

  // Update the payment status of the order
  order.paymentStatus = paymentStatus;

  // Save the updated order
  await order.save();

  return res.status(200).json(new ApiResponse(200, order, "Payment status updated successfully"));
});


export { createOrder, getUserOrders, getAllOrders,sendFilesAndCompleteOrder,getCompletedOrders,updatePaymentStatus };
