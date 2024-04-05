import express from "express";
import imageController from "../controllers/imageController.js";

const router = express.Router();

router.get("/:key", imageController.find);

export default router;
