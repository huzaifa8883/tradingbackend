import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apierror.js";
import { ApiResponse } from "../utils/apiresponse.js";
import { vector } from "../models/vector.js";

// Create a new order
const createvector = asyncHandler(async (req, res) => {
  const {
    designName,
    format,
    // location,
    file,
    fileUrl,
    height,
    width,
    colorName,
    numberOfColors,
 
    expectedDelivery,
    comments,
    isRush, // Get rush status from request body
    price, 
    paymentStatus, // Use the exact price from the frontend
  } = req.body;

  // Assuming userId is stored in req.user.id after authentication middleware
  const userId = req.user.id;

  // Validate input fields
  if (![designName,  height, width, colorName, numberOfColors,  expectedDelivery].every(field => field?.trim() !== "")) {
    throw new ApiError(400, "All required fields must be filled");
  }
  if (paymentStatus && !['Pending', 'Success', 'Failed'].includes(paymentStatus)) {
    throw new ApiError(400, "Invalid payment status. It must be 'Pending', 'Success', or 'Failed'.");
  }

  // Create a new order without adjusting price further
  const newOrder = await vector.create({
    userId,
    designName,
    format,
    // location,
    file,
    fileUrl,
    height,
    width,
    colorName,
    numberOfColors,
 
    expectedDelivery,
    comments,
    isRush,
    price,
    status: "Pending",
    paymentStatus: paymentStatus || 'Pending',  // Use the provided price directly
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
const getUservectors = asyncHandler(async (req, res) => {
  const userId = req.user.id; // Get the user ID from the authentication middleware

  // Find orders by the authenticated userId
  const orders = await vector.find({ userId });

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
const getAllvectors = asyncHandler(async (req, res) => {
  // Retrieve all orders from the database where status is 'Pending'
  const orders = await vector.find({ status: "Pending" });

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

const getCompletedvectors = asyncHandler(async (req, res) => {
  // Retrieve all orders from the database where status is 'Completed'
  const completedvectors = await vector.find({ status: "Completed" });

  // If no completed orders are found, return an empty array
  // if (completedvectors.length === 0) {
  //   return res.status(404).json(
  //     new ApiResponse(404, [], "No completed orders found")
  //   );
  // }

  return res.status(200).json(
    new ApiResponse(200, completedvectors, "All completed orders retrieved successfully")
  );
})

const sendFilesAndCompletevector = asyncHandler(async (req, res) => {
  const { vectorId } = req.params;
  const { fileUrls } = req.body;  // Expect an array of URLs from the frontend

  // Find the order by ID
  const order = await vector.findById(vectorId);
  // if (!order) {
  //   return res.status(404).json(new ApiResponse(404, null, "Order not found"));
  // }

  // Check if userFiles is already an array; if not, initialize it as an array
  order.userFiles = Array.isArray(order.userFiles) ? order.userFiles : [];

  // Append new URLs to userFiles or replace them entirely, depending on your preference
  order.userFiles = [...order.userFiles, ...fileUrls]; // Append new URLs
// Append new URLs

  // Update the order status and mark fileSent as true
  order.fileSent = true;
  order.status = 'Completed';

  // Save the updated order
  await order.save();

  return res.status(200).json(new ApiResponse(200, order, "Order completed and file sent"));
});

const updatePaymentStatusvector = asyncHandler(async (req, res) => {
  const { vectorId } = req.params;  // Get order ID from URL parameter
  const { paymentStatus } = req.body;  // Get new payment status from request body

  // Validate the payment status
  if (!paymentStatus || !['Pending', 'Success', 'Failed'].includes(paymentStatus)) {
    throw new ApiError(400, "Invalid payment status. It must be 'Pending', 'Success', or 'Failed'.");
  }

  // Find the order by ID
  const order = await vector.findById(vectorId);
  if (!order) {
    return res.status(404).json(new ApiResponse(404, null, "Order not found"));
  }

  // Update the payment status of the order
  order.paymentStatus = paymentStatus;

  // Save the updated order
  await order.save();

  return res.status(200).json(new ApiResponse(200, order, "Payment status updated successfully"));
});
export { createvector, getUservectors, getAllvectors,sendFilesAndCompletevector,getCompletedvectors,updatePaymentStatusvector };
