import express from "express";
import subscriptionController from "../controllers/subscriptionController.js";
import { asyncHandler } from "../handlers/asyncHandler.js";
import authorization from "../middleware/authorization.js";

const router = express.Router();

router.post(
  "/create-payment-intent",
  authorization,
  asyncHandler(subscriptionController.createPaymentIntent),
);
router.post("/find", authorization, asyncHandler(subscriptionController.find));
router.post(
  "/confirm",
  authorization,
  asyncHandler(subscriptionController.confirm),
);
router.post(
  "/cancel",
  authorization,
  asyncHandler(subscriptionController.cancel),
);
router.post("/pay", authorization, asyncHandler(subscriptionController.pay));

export default router;
