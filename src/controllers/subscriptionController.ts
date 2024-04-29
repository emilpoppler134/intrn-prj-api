import { Request, Response } from "express";
import { UpdateResult } from "mongodb";
import Stripe from "stripe";
import { STRIPE_SECRET_KEY } from "../config.js";
import { User } from "../models/User.js";
import { ParamValue } from "../types/ParamValue.js";
import { ErrorCode, SuccessCode } from "../types/StatusCode.js";
import { TokenPayload } from "../types/TokenPayload.js";
import { ErrorResponse, sendValidResponse } from "../utils/sendResponse.js";

type SubscriptionExpanded = Stripe.Subscription & {
  latest_invoice: {
    payment_intent: Stripe.PaymentIntent;
  };
};

type PaymentIntentResponse = {
  productId: string;
  clientSecret: string;
};

type SubscriptionResponse = {
  id: string;
  name: string;
  price: number;
  status: string;
  latest_invoice: string;
  current_period_start: number;
  current_period_end: number;
  days_until_due: number;
  default_payment_method: string;
  created: number;
};

const stripe = new Stripe(STRIPE_SECRET_KEY);

async function createPaymentIntent(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;
  const id: ParamValue = req.body.id;

  const subscriptions =
    await (async (): Promise<Array<Stripe.Subscription> | null> => {
      try {
        // List all users subscriptions
        return (
          await stripe.subscriptions.list({
            customer: user.customer_id,
          })
        ).data;
      } catch {
        return null;
      }
    })();

  if (subscriptions === null) {
    throw new ErrorResponse(
      ErrorCode.SERVER_ERROR,
      "Something went wrong when connecting to stripe.",
    );
  }

  // If user has a subscription that is active or unpaid, return error
  if (
    subscriptions.some((item) => ["active", "past_due"].includes(item.status))
  ) {
    throw new ErrorResponse(
      ErrorCode.CONFLICT,
      "You already have an active subscription. Cancel it to start a new one.",
    );
  }

  // Check if all required values is defined
  if (id === undefined) {
    throw new ErrorResponse(ErrorCode.BAD_REQUEST, "Invalid parameters.");
  }

  // Fetch product from stripe API
  const product = await (async (): Promise<Stripe.Product | null> => {
    try {
      return await stripe.products.retrieve(id);
    } catch {
      return null;
    }
  })();

  if (product === null) {
    throw new ErrorResponse(ErrorCode.NO_RESULT, "Couldn't find the product.");
  }

  // Fetch price from stripe API
  const priceId = await (async (): Promise<string | null> => {
    try {
      const stripeProduct = await stripe.products.retrieve(product.id);
      const priceId = stripeProduct.default_price;

      if (typeof priceId !== "string") {
        throw new Error();
      }

      return priceId;
    } catch {
      return null;
    }
  })();

  if (priceId === null) {
    throw new ErrorResponse(
      ErrorCode.SERVER_ERROR,
      "Something went wrong when fetching the price.",
    );
  }

  // If user has a subscription that is incomplete for the same subscription plan, return that
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: user.customer_id,
      expand: ["data.latest_invoice.payment_intent"],
    });

    for (let i = 0; i < subscriptions.data.length; i++) {
      const subscription = subscriptions.data[i] as SubscriptionExpanded;

      if (
        subscription.items.data.some((item) => item.price.id === priceId) &&
        subscription.status === "incomplete"
      ) {
        const clientSecret =
          subscription.latest_invoice.payment_intent.client_secret;

        if (clientSecret === null) {
          throw new Error();
        }

        const paymentIntent: PaymentIntentResponse = {
          productId: id,
          clientSecret,
        };

        return sendValidResponse<PaymentIntentResponse>(
          res,
          SuccessCode.OK,
          paymentIntent,
        );
      }
    }
  } catch {
    throw new ErrorResponse(
      ErrorCode.SERVER_ERROR,
      "Something went wrong when fetching your current subscriptions.",
    );
  }

  // Create a new subscription
  try {
    const subscription = (await stripe.subscriptions.create({
      customer: user.customer_id,
      items: [
        {
          price: priceId,
        },
      ],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      expand: ["latest_invoice.payment_intent"],
    })) as SubscriptionExpanded;

    const clientSecret =
      subscription.latest_invoice.payment_intent.client_secret;

    if (clientSecret === null) {
      throw new ErrorResponse(
        ErrorCode.SERVER_ERROR,
        "Something went wrong when fetching the client secret of your payment intent.",
      );
    }

    const paymentIntent: PaymentIntentResponse = {
      productId: id,
      clientSecret,
    };

    return sendValidResponse<PaymentIntentResponse>(
      res,
      SuccessCode.CREATED,
      paymentIntent,
    );
  } catch (error) {
    if (error instanceof ErrorResponse) throw error;

    if (error instanceof Stripe.errors.StripeError) {
      throw new ErrorResponse(ErrorCode.CONFLICT, error.message);
    }
  }
}

async function find(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;
  const id: ParamValue = req.body.id;

  // Check if all required values is defined
  if (id === undefined) {
    throw new ErrorResponse(ErrorCode.BAD_REQUEST, "Invalid parameters.");
  }

  // Fetch subscription from stripe by id
  const subscription = await (async (): Promise<Stripe.Subscription | null> => {
    try {
      return await stripe.subscriptions.retrieve(id);
    } catch {
      return null;
    }
  })();

  // Return error if no result
  // Or if subscription customer isn't user
  // Or if subscription status isn't active or past_due
  if (
    subscription === null ||
    subscription.customer !== user.customer_id ||
    !["active", "past_due"].includes(subscription.status)
  ) {
    throw new ErrorResponse(
      ErrorCode.NO_RESULT,
      "You have no subscription with that id.",
    );
  }

  // Find the subscription item that is active
  const subscriptionItem = subscription.items.data.find(
    (item) => item.price.active === true,
  );

  if (subscriptionItem === undefined) {
    throw new ErrorResponse(
      ErrorCode.SERVER_ERROR,
      "Your subscription doesn't have a subscription item.",
    );
  }

  // If subscriptionItem don't have a unit amount, return error
  if (subscriptionItem.price.unit_amount === null) {
    throw new ErrorResponse(
      ErrorCode.SERVER_ERROR,
      "Your subscription doesn't have a price.",
    );
  }

  // Get the productId from subscription item
  const productId = subscriptionItem.price.product as string;
  // Fetch product from stripe API by product Id
  const product = await stripe.products.retrieve(productId);

  // Only return the important data
  const subscriptionResponse: SubscriptionResponse = {
    id: subscription.id,
    name: product.name,
    price: subscriptionItem.price.unit_amount / 100,
    status: subscription.status as string,
    latest_invoice: subscription.latest_invoice as string,
    current_period_start: subscription.current_period_start,
    current_period_end: subscription.current_period_end,
    days_until_due: subscription.days_until_due as number,
    default_payment_method: subscription.default_payment_method as string,
    created: subscription.created,
  };

  return sendValidResponse<SubscriptionResponse>(
    res,
    SuccessCode.OK,
    subscriptionResponse,
  );
}

async function confirm(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;

  // List all customers subscriptions
  const subscriptions =
    await (async (): Promise<Array<Stripe.Subscription> | null> => {
      try {
        return (
          await stripe.subscriptions.list({
            customer: user.customer_id,
          })
        ).data;
      } catch {
        return null;
      }
    })();

  if (subscriptions === null) {
    throw new ErrorResponse(
      ErrorCode.SERVER_ERROR,
      "Something went wrong when connecting to stripe.",
    );
  }

  // Find the active one
  const activeSubscription = subscriptions.find(
    (item) => item.status === "active",
  );

  if (activeSubscription === undefined) {
    throw new ErrorResponse(
      ErrorCode.NO_RESULT,
      "Your subscription isn't active.",
    );
  }

  // Update the database so user gets the subscription status and id
  const updateUser: UpdateResult = await User.updateOne(
    { _id: user._id },
    {
      subscription: {
        status: "active",
        subscription_id: activeSubscription.id,
      },
    },
  );
  // If something went wrong, return an error
  if (updateUser.acknowledged === false) {
    throw new ErrorResponse(
      ErrorCode.SERVER_ERROR,
      "Something went wrong when updating the subscription.",
    );
  }

  return sendValidResponse(res, SuccessCode.NO_CONTENT);
}

async function cancel(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;
  const id: ParamValue = req.body.id;

  // Check if all required values is defined
  if (id === undefined) {
    throw new ErrorResponse(ErrorCode.BAD_REQUEST, "Invalid parameters.");
  }

  // Fetch subscription from stripe by id
  const subscription = await (async (): Promise<Stripe.Subscription | null> => {
    try {
      return await stripe.subscriptions.retrieve(id);
    } catch {
      return null;
    }
  })();

  // Return error if no subscription
  // Or if subscription customer isn't user
  if (subscription === null || subscription.customer !== user.customer_id) {
    throw new ErrorResponse(
      ErrorCode.NO_RESULT,
      "You have no subscription with that id.",
    );
  }

  // Cancel the subscription
  try {
    const canceledSubscription = await stripe.subscriptions.cancel(id);
    // If subscription isn't canceled, return error
    if (canceledSubscription.status !== "canceled") {
      throw new Error();
    }
  } catch {
    throw new ErrorResponse(
      ErrorCode.SERVER_ERROR,
      "Something went wrong when canceling your subscription.",
    );
  }

  // Update the database so user gets the subscription status and id
  const updateUser: UpdateResult = await User.updateOne(
    { _id: user._id },
    { subscription: { status: null, subscription_id: null } },
  );
  // If something went wrong, return an error
  if (updateUser.acknowledged === false) {
    throw new ErrorResponse(
      ErrorCode.SERVER_ERROR,
      "Something went wrong when updating the subscription.",
    );
  }

  return sendValidResponse(res, SuccessCode.NO_CONTENT);
}

async function pay(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;
  const id: ParamValue = req.body.id;

  // Check if all required values is defined
  if (id === undefined) {
    throw new ErrorResponse(ErrorCode.BAD_REQUEST, "Invalid parameters.");
  }

  // Fetch the subscription from stripe API be id
  const subscription = await (async (): Promise<Stripe.Subscription | null> => {
    try {
      return await stripe.subscriptions.retrieve(id);
    } catch {
      return null;
    }
  })();

  // Return no result if subscription is null
  // Or if subscription customer isn't user
  if (subscription === null || subscription.customer !== user.customer_id) {
    throw new ErrorResponse(
      ErrorCode.NO_RESULT,
      "You have no subscription with that id.",
    );
  }

  // If subscription isn't past_due, return error
  if (subscription.status !== "past_due") {
    throw new ErrorResponse(
      ErrorCode.CONFLICT,
      "You already have an active subscription.",
    );
  }

  // If subscription dont have a unpaid invoice
  if (subscription.latest_invoice === null) {
    throw new ErrorResponse(
      ErrorCode.NO_RESULT,
      "Your subscription has no unpaid invoice.",
    );
  }

  try {
    const paymentIntent = await stripe.invoices.pay(
      subscription.latest_invoice as string,
    );

    if (paymentIntent.status !== "paid") {
      throw new Error();
    }

    // Update the database so user gets the subscription status and id
    await User.updateOne(
      { _id: user._id },
      { subscription: { status: "active", subscription_id: subscription.id } },
    );

    return sendValidResponse(res, SuccessCode.NO_CONTENT);
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      throw new ErrorResponse(ErrorCode.CONFLICT, error.message);
    }
  }
}

export default { createPaymentIntent, find, confirm, cancel, pay };
