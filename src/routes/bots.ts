import express from 'express';
import botController from '../controllers/botController.js';
import authorization from '../middleware/authorization.js';

const router = express.Router();

router.post("/find", authorization, botController.find);
router.post("/list", authorization, botController.list);
router.post("/create", authorization, botController.create);
router.post("/remove", authorization, botController.remove);

export default router;