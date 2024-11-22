// routes/user.routes.js
import { Router } from "express";
import { loginUser, registerUser, logoutUser, userStatus, getUserDetails, getAllUsers,forgotPassword, resetPassword } from "../controller/user.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { createOrder, getAllOrders, getCompletedOrders, getUserOrders,sendFilesAndCompleteOrder,updatePaymentStatus} from "../controller/order.controller.js";
import { Order } from "../models/order.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apierror.js";
import { ApiResponse } from "../utils/apiresponse.js";
import { createvector, getAllvectors, getCompletedvectors, getUservectors, sendFilesAndCompletevector, updatePaymentStatusvector } from "../controller/vector.controller.js";


const router = Router();

router.route("/signup").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/status").get(verifyJWT, userStatus);
router.route("/getuser/:userId").get(verifyJWT, getUserDetails); // Correct route for fetching user details
router.route("/getalluser").get( getAllUsers);
router.route("/createorder").post(verifyJWT, createOrder);
router.route("/allorders").get( getAllOrders);
router.route("/getcompleted").get(getCompletedOrders);
router.route("/getcompletedd").get(getCompletedvectors);
router.route("/getorder").get( verifyJWT,getUserOrders);

router.route('/orders/:orderId/complete').put(sendFilesAndCompleteOrder)
// Get order(s) for a specific user

   // Correct route for fetching order details

   router.route("/createvector").post(verifyJWT, createvector);
router.route("/allvector").get( getAllvectors);

router.route("/getvector").get( verifyJWT,getUservectors);

router.route('/vectors/:vectorId/complete').put(sendFilesAndCompletevector)
router.put('/orders/:orderId/payment-status', verifyJWT,updatePaymentStatus);
router.put('/vectors/:vectorId/payment-status',verifyJWT, updatePaymentStatusvector);
router.post("/forgot-password",forgotPassword)
router.post("/reset-password", resetPassword);


export default router;
