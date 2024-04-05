import { Request, Response } from "express";
import Stripe from "stripe";
import { STRIPE_SECRET_KEY } from "../config.js";
import { ErrorResponse, ValidResponse } from "../lib/response.js";
import { ErrorType } from "../types/Error.js";
import { ParamValue } from "../types/ParamValue.js";

const stripe = new Stripe(STRIPE_SECRET_KEY);

type ProductExpanded = Stripe.Product & {
  default_price: Stripe.Price;
};

async function list(req: Request, res: Response) {
  try {
    // Fetch all active products from stripe
    const products = await stripe.products.list({
      active: true,
      expand: ["data.default_price"],
    });

    // If one of the products dont have a price, return error
    for (let i = 0; i < products.data.length; i++) {
      const product = products.data[i] as ProductExpanded;

      if (product.default_price.unit_amount === null) {
        res.json(new ErrorResponse(ErrorType.STRIPE_ERROR));
        return;
      }
    }

    // Map the products
    const productResponse = products.data.map((item) => {
      const product = item as ProductExpanded;
      const price = product.default_price.unit_amount as number;

      return {
        id: item.id,
        name: item.name,
        price: price / 100,
      };
    });

    // Return products
    res.json(new ValidResponse(productResponse));
  } catch {
    res.json(new ErrorResponse(ErrorType.STRIPE_ERROR));
    return;
  }
}

async function find(req: Request, res: Response) {
  const id: ParamValue = req.body.id;

  // Check if all required values is defined
  if (id === undefined) {
    res.json(new ErrorResponse(ErrorType.INVALID_PARAMS));
    return;
  }

  try {
    // Fetch the product from stripe by id
    const product = (await stripe.products.retrieve(id, {
      expand: ["default_price"],
    })) as ProductExpanded;

    // if product is not active, return no result
    if (product.active !== true) {
      throw new Error();
    }

    // if product dont have a price, return error
    if (product.default_price.unit_amount === null) {
      res.json(new ErrorResponse(ErrorType.STRIPE_ERROR));
      return;
    }

    const price = product.default_price.unit_amount;

    const productResponse = {
      id: product.id,
      name: product.name,
      price: price / 100,
    };

    // Return product
    res.json(new ValidResponse(productResponse));
  } catch {
    res.json(new ErrorResponse(ErrorType.NO_RESULT));
    return;
  }
}

export default { list, find };
