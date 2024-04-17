import express from "express";
import imageController from "../controllers/imageController.js";
import { asyncHandler } from "../handlers/asyncHandler.js";

const router = express.Router();

router.get("/:key", asyncHandler(imageController.find));

export default router;
