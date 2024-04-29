import express from "express";
import modelController from "../controllers/modelController.js";
import { asyncHandler } from "../handlers/asyncHandler.js";

const router = express.Router();

router.post("/list", asyncHandler(modelController.list));

export default router;
