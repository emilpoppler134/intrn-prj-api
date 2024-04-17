import express from "express";
import productController from "../controllers/productController.js";
import { asyncHandler } from "../handlers/asyncHandler.js";

const router = express.Router();

router.post("/list", asyncHandler(productController.list));
router.post("/find", asyncHandler(productController.find));

export default router;
