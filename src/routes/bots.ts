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
router.get(
  "/:id/files/:file/download",
  authorization,
  subscriptionAuthorization,
  asyncHandler(botController.downloadFile),
);
router.post(
  "/:id/files/upload",
  authorization,
  subscriptionAuthorization,
  asyncHandler(botController.uploadFile),
);
router.post(
  "/:id/files/remove",
  authorization,
  subscriptionAuthorization,
  asyncHandler(botController.removeFile),
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
  "/:id/chats",
  authorization,
  subscriptionAuthorization,
  asyncHandler(botController.listChats),
);
router.post(
  "/:id/chats/create",
  authorization,
  subscriptionAuthorization,
  asyncHandler(botController.createChat),
);
router.post(
  "/:id/chats/remove",
  authorization,
  subscriptionAuthorization,
  asyncHandler(botController.removeChat),
);
router.post(
  "/:id/:chatId/chat",
  authorization,
  subscriptionAuthorization,
  asyncHandler(botController.chat),
);

export default router;
