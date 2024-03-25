import express from 'express';
import userController from '../controllers/userController.js';

const router = express.Router();

router.post("/find", userController.find);
router.post("/login", userController.login);
router.post("/validate-token", userController.validateToken);
router.post("/signup-request", userController.signupRequest);
router.post("/signup-confirmation", userController.signupConfirmation);
router.post("/signup-submit", userController.signupSubmit);
router.post("/forgot-password-request", userController.forgotPasswordRequest);
router.post("/forgot-password-confirmation", userController.forgotPasswordConfirmation);
router.post("/forgot-password-submit", userController.forgotPasswordSubmit);

export default router;