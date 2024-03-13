import express from 'express';
import userController from '../controllers/userController.js';

const router = express.Router();

router.post("/find", userController.find);
router.post("/login", userController.login);
router.post("/signup", userController.signup);
router.post("/logout", userController.logout);
router.post("/forgot-password-request", userController.forgotPasswordRequest);
router.post("/forgot-password-confirmation", userController.forgotPasswordConfirmation);
router.post("/forgot-password-reset", userController.forgotPasswordReset);

export default router;