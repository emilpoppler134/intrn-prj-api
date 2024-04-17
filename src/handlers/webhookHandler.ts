import { Request, Response } from "express";
import Stripe from "stripe";
import { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } from "../config.js";
import { User } from "../models/User.js";

const stripe = new Stripe(STRIPE_SECRET_KEY);

export async function handleWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"];

  if (sig === undefined) {
    res.status(400).send(`Webhook Error: signature undefined`);
    return;
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      res.status(400).send(`Webhook Error: ${error.message}`);
      return;
    }
  }

  if (event === undefined) {
    res.status(400).send(`Webhook Error: event undefined`);
    return;
  }

  switch (event.type) {
    case "invoice.paid": {
      if (event.data.object.subscription === null) {
        res
          .status(400)
          .send(`Webhook Error: No subscription_id in the paid invoice.`);
        return;
      }

      const subscription = await (async (invoice: Stripe.Invoice) => {
        try {
          return await stripe.subscriptions.retrieve(
            invoice.subscription as string
          );
        } catch {
          return null;
        }
      })(event.data.object);

      if (subscription === null) {
        res
          .status(400)
          .send(`Webhook Error: No subscription with the id from the invoice.`);
        return;
      }

      if (subscription.status === "active") {
        await User.updateOne(
          { customer_id: event.data.object.customer },
          {
            subscription: {
              status: "active",
              subscription_id: subscription.id,
            },
          }
        );
      }

      break;
    }

    case "invoice.payment_failed": {
      if (event.data.object.subscription === null) {
        res
          .status(400)
          .send(`Webhook Error: No subscription_id in the unpaid invoice.`);
        return;
      }

      const subscription = await (async (invoice: Stripe.Invoice) => {
        try {
          return await stripe.subscriptions.retrieve(
            invoice.subscription as string
          );
        } catch {
          return null;
        }
      })(event.data.object);

      if (subscription === null) {
        res
          .status(400)
          .send(`Webhook Error: No subscription with the id from the invoice.`);
        return;
      }

      if (subscription.status === "past_due") {
        await User.updateOne(
          { customer_id: event.data.object.customer },
          {
            subscription: {
              status: "past_due",
              subscription_id: subscription.id,
            },
          }
        );
      }

      break;
    }

    case "customer.subscription.deleted": {
      if (
        event.data.object.status === "canceled" ||
        event.data.object.status === "unpaid"
      ) {
        await User.updateOne(
          { customer_id: event.data.object.customer },
          { subscription: { status: null, subscription_id: null } }
        );
      }

      break;
    }

    // Add more cases for other events as needed
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.send();
}
