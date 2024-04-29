import express from "express";
import botController from "../controllers/botController.js";
import { asyncHandler } from "../handlers/asyncHandler.js";
import authorization from "../middleware/authorization.js";
import subscriptionAuthorization from "../middleware/subscriptionAuthorization.js";

const router = express.Router();

router.post("/list", authorization, asyncHandler(botController.list));
router.post(
  "/find",
  authorization,
  subscriptionAuthorization,
  asyncHandler(botController.find),
);
router.post(
  "/create",
  authorization,
  subscriptionAuthorization,
  asyncHandler(botController.create),
);
router.post(
  "/:id/update",
  authorization,
  subscriptionAuthorization,
  asyncHandler(botController.update),
);
router.post(
  "/:id/remove",
  authorization,
  subscriptionAuthorization,
  asyncHandler(botController.remove),
);
router.post(
  "/:id/chat",
  authorization,
  subscriptionAuthorization,
  asyncHandler(botController.chat),
);

export default router;
