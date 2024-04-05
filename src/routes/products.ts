import express from "express";
import productController from "../controllers/productController.js";

const router = express.Router();

router.post("/list", productController.list);
router.post("/find", productController.find);

export default router;
