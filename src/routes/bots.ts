import express from "express";
import botController from "../controllers/botController.js";
import authorization from "../middleware/authorization.js";
import subscriptionAuthorization from "../middleware/subscriptionAuthorization.js";

const router = express.Router();

router.post("/list", authorization, botController.list);
router.post(
  "/find",
  authorization,
  subscriptionAuthorization,
  botController.find,
);
router.post(
  "/create",
  authorization,
  subscriptionAuthorization,
  botController.create,
);
router.post(
  "/remove",
  authorization,
  subscriptionAuthorization,
  botController.remove,
);

export default router;
