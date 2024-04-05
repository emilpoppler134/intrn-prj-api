import express from 'express';
import subscriptionController from '../controllers/subscriptionController.js';
import authorization from '../middleware/authorization.js';

const router = express.Router();

router.post("/create-payment-intent", authorization, subscriptionController.createPaymentIntent);
router.post("/find", authorization, subscriptionController.find);
router.post("/confirm", authorization, subscriptionController.confirm);
router.post("/cancel", authorization, subscriptionController.cancel);
router.post("/pay", authorization, subscriptionController.pay);

export default router;