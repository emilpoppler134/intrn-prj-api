import express from 'express';
import userController from '../controllers/userController.js';

const router = express.Router();

router.post("/login", userController.login);
router.post("/signup", userController.signup);
router.post("/forgot-password-request", userController.forgotPasswordRequest);
router.post("/forgot-password-confirmation", userController.forgotPasswordConfirmation);

export default router;