import { Request, Response } from "express";
import Stripe from "stripe";
import { STRIPE_SECRET_KEY } from "../config.js";
import { ParamValue } from "../types/ParamValue.js";
import { ErrorCode, SuccessCode } from "../types/StatusCode.js";
import { ErrorResponse, sendValidResponse } from "../utils/sendResponse.js";

const stripe = new Stripe(STRIPE_SECRET_KEY);

type ProductExpanded = Stripe.Product & {
  default_price: Stripe.Price;
};

type ProductResponse = {
  id: string;
  name: string;
  price: number;
};

async function list(req: Request, res: Response) {
  const products = await (async (): Promise<Array<ProductExpanded> | null> => {
    try {
      // List all users subscriptions
      return (
        await stripe.products.list({
          active: true,
          expand: ["data.default_price"],
        })
      ).data as Array<ProductExpanded>;
    } catch {
      return null;
    }
  })();

  if (products === null) {
    throw new ErrorResponse(
      ErrorCode.SERVER_ERROR,
      "Something went wrong when connecting to stripe.",
    );
  }

  // If one of the products dont have a price, return error
  for (let i = 0; i < products.length; i++) {
    const product = products[i];

    if (product.default_price.unit_amount === null) {
      throw new ErrorResponse(
        ErrorCode.SERVER_ERROR,
        "Some products don't have a price.",
      );
    }
  }

  // Map the products
  const productResponse: Array<ProductResponse> = products.map((item) => {
    const product = item as ProductExpanded;
    const price = product.default_price.unit_amount as number;

    return {
      id: item.id,
      name: item.name,
      price: price / 100,
    };
  });

  // Return products
  return sendValidResponse<Array<ProductResponse>>(
    res,
    SuccessCode.OK,
    productResponse,
  );
}

async function find(req: Request, res: Response) {
  const id: ParamValue = req.body.id;

  // Check if all required values is defined
  if (id === undefined) {
    throw new ErrorResponse(ErrorCode.BAD_REQUEST, "Invalid parameters.");
  }

  // Fetch the product from stripe by id
  const product = await (async (): Promise<ProductExpanded | null> => {
    try {
      return (await stripe.products.retrieve(id, {
        expand: ["default_price"],
      })) as ProductExpanded;
    } catch {
      return null;
    }
  })();

  // if product is not active, return no result
  if (product === null || product.active !== true) {
    throw new ErrorResponse(
      ErrorCode.NO_RESULT,
      "There is no product with that id.",
    );
  }

  // if product dont have a price, return error
  if (product.default_price.unit_amount === null) {
    throw new ErrorResponse(
      ErrorCode.SERVER_ERROR,
      "The product don't have a price.",
    );
  }

  const price = product.default_price.unit_amount;

  const productResponse: ProductResponse = {
    id: product.id,
    name: product.name,
    price: price / 100,
  };

  // Return product
  return sendValidResponse<ProductResponse>(
    res,
    SuccessCode.OK,
    productResponse,
  );
}

export default { list, find };
