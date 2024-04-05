import { Request, Response } from "express";
import Stripe from 'stripe';

import { STRIPE_SECRET_KEY } from "../config.js";
import { ErrorResponse, ValidResponse } from "../lib/response.js";
import { ErrorType } from "../types/Error.js";
import { ParamValue } from "../types/ParamValue.js";
import { TokenPayload } from "../types/TokenPayload.js";
import { User } from "../models/User.js";

type SubscriptionExpanded = Stripe.Subscription & {
  latest_invoice: {
    payment_intent: Stripe.PaymentIntent
  }
};

const stripe = new Stripe(STRIPE_SECRET_KEY);

async function createPaymentIntent(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;
  const id: ParamValue = req.body.id;

  try {
    // List all users subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: user.customer_id,
    });

    // If user has a subscription that is active or unpaid, return error
    if (subscriptions.data.some(item => ["active", "past_due"].includes(item.status))) {
      res.json(new ErrorResponse(ErrorType.ALREADY_EXISTING));
      return;
    }
  } catch {
    res.json(new ErrorResponse(ErrorType.STRIPE_ERROR));
    return;
  }

  // Check if all required values is defined
  if (id === undefined) {
    res.json(new ErrorResponse(ErrorType.INVALID_PARAMS));
    return;
  }

  // Fetch product from stripe API
  const product = await (
    async (productId: string): Promise<Stripe.Product | null> => {
      try {
        return await stripe.products.retrieve(productId);
      } catch {
        return null;
      }
    }
  )(id);

  if (product === null) {
    res.json(new ErrorResponse(ErrorType.NO_RESULT));
    return;
  }

  // Fetch price from stripe API
  const priceId = await (
    async(productId: string): Promise<string | null> => {
      try {
        const stripeProduct = await stripe.products.retrieve(productId);
        const priceId = stripeProduct.default_price;
    
        if (typeof priceId !== "string") {
          throw new Error();
        }
    
        return priceId;
      } catch {
        return null;
      }
    }
  )(product.id);

  if (priceId === null) {
    res.json(new ErrorResponse(ErrorType.STRIPE_ERROR));
    return;
  }

  // If user has a subscription that is incomplete for the same subscription plan, return that
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: user.customer_id,
      expand: ['data.latest_invoice.payment_intent']
    });

    for (let i = 0; i < subscriptions.data.length; i++) {
      const subscription = subscriptions.data[i] as SubscriptionExpanded;

      if (!subscription.items.data.some(item => item.price.id === priceId) && subscription.status === "incomplete") {
        const subscriptionResponse = {
          productId: id,
          clientSecret: subscription.latest_invoice.payment_intent.client_secret,
        }
        res.json(new ValidResponse(subscriptionResponse));
        return;
      }
    }
  } catch {
    res.json(new ErrorResponse(ErrorType.STRIPE_ERROR));
    return;
  }

  // Create a new subscription
  try {
    const subscription = await stripe.subscriptions.create({
      customer: user.customer_id,
      items: [{
        price: priceId,
      }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    }) as SubscriptionExpanded;

    const subscriptionResponse = {
      productId: id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
    }

    res.json(new ValidResponse(subscriptionResponse));
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      res.status(400).send({ error: { message: error.message } });
      return;
    }
  }
}

async function find(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;
  const id: ParamValue = req.body.id;

  // Check if all required values is defined
  if (id === undefined) {
    res.json(new ErrorResponse(ErrorType.INVALID_PARAMS));
    return;
  }

  try {
    // Fetch subscription from stripe by id
    const subscription = await stripe.subscriptions.retrieve(id);

    // If subscription customer isn't user, return no result
    if (subscription.customer !== user.customer_id) {
      res.json(new ErrorResponse(ErrorType.NO_RESULT));
      return;
    }

    // If subscription status isn't active or past_due, return no result
    if (!["active", "past_due"].includes(subscription.status)) {
      res.json(new ErrorResponse(ErrorType.NO_RESULT));
      return;
    }

    // Find the subscription item that is active
    const subscriptionItem = subscription.items.data.find(item => item.price.active === true);

    if (subscriptionItem === undefined) {
      res.json(new ErrorResponse(ErrorType.STRIPE_ERROR));
      return;
    }

    // If subscriptionItem don't have a unit amount, return error
    if (subscriptionItem.price.unit_amount === null) {
      res.json(new ErrorResponse(ErrorType.STRIPE_ERROR));
      return;
    }

    // Get the productId from subscription item
    const productId = subscriptionItem.price.product as string;
    // Fetch product from stripe API by product Id
    const product = await stripe.products.retrieve(productId);

    // Only return the important data
    const subscriptionResponse = {
      id: subscription.id,
      name: product.name,
      price: subscriptionItem.price.unit_amount / 100,
      status: subscription.status as string,
      latest_invoice: subscription.latest_invoice as string,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      days_until_due: subscription.days_until_due as number,
      default_payment_method: subscription.default_payment_method as string,
      created: subscription.created
    }

    res.json(new ValidResponse(subscriptionResponse));
  } catch {
    res.json(new ErrorResponse(ErrorType.NO_RESULT));
  }
}

async function confirm(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;

  try {
    // List all customers subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: user.customer_id,
    });

    // Find the active one
    const activeSubscription = subscriptions.data.find(item => item.status === "active");

    if (activeSubscription === undefined) {
      res.json(new ErrorResponse(ErrorType.NO_RESULT));
      return;
    }

    // Update the database so user gets the subscription status and id
    await User.updateOne(
      { _id: user._id },
      { subscription: { status: "active", subscription_id: activeSubscription.id }}
    );

    res.json(new ValidResponse());
  } catch {
    res.json(new ErrorResponse(ErrorType.STRIPE_ERROR));
    return;
  }
}

async function cancel(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;
  const id: ParamValue = req.body.id;

  // Check if all required values is defined
  if (id === undefined) {
    res.json(new ErrorResponse(ErrorType.INVALID_PARAMS));
    return;
  }

  try {
    // Fetch the subscription from stripe API be id
    const subscription = await stripe.subscriptions.retrieve(id);

    // If subscription customer isn't user, return no result
    if (subscription.customer !== user.customer_id) {
      res.json(new ErrorResponse(ErrorType.NO_RESULT));
      return;
    }

    // Cancel the subscription
    const canceledSubscription = await stripe.subscriptions.cancel(id);

    // If subscription isn't canceled, return error
    if (canceledSubscription.status !== "canceled") {
      throw new Error();
    }

    // Update the database so user gets the subscription status and id
    await User.updateOne(
      { _id: user._id },
      { subscription: { status: null, subscription_id: null }}
    );

    res.json(new ValidResponse());
  } catch {
    res.json(new ErrorResponse(ErrorType.STRIPE_ERROR));
    return;
  }
}

async function pay(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;
  const id: ParamValue = req.body.id;

  // Check if all required values is defined
  if (id === undefined) {
    res.json(new ErrorResponse(ErrorType.INVALID_PARAMS));
    return;
  }

  try {
    // Fetch the subscription from stripe API be id
    const subscription = await stripe.subscriptions.retrieve(id);

    // If subscription customer isn't user, return no result
    if (subscription.customer !== user.customer_id) {
      res.json(new ErrorResponse(ErrorType.NO_RESULT));
      return;
    }

    // If subscription isn't past_due, return error
    if (subscription.status !== "past_due") {
      res.json(new ErrorResponse(ErrorType.ALREADY_EXISTING));
      return;
    }

    if (subscription.latest_invoice === null) {
      res.json(new ErrorResponse(ErrorType.NO_RESULT));
      return;
    }

    const paymentIntent = await stripe.invoices.pay(subscription.latest_invoice as string);

    if (paymentIntent.status !== "paid") {
      throw new Error();
    }

    // Update the database so user gets the subscription status and id
    await User.updateOne(
      { _id: user._id },
      { subscription: { status: "active", subscription_id: subscription.id }}
    );

    res.json(new ValidResponse());
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      res.status(400).send({ error: { message: error.message } });
      return;
    }
  }
}

export default { createPaymentIntent, find, confirm, cancel, pay }