import { Schema, model, Types } from "mongoose";

type IUser = {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password_hash: string;
  subscription: Subscription;
  customer_id: string;
  timestamp: Date;
};

type Subscription = {
  status: "active" | "past_due" | null;
  subscription_id: string | null;
};

const schema = new Schema<IUser>({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password_hash: {
    type: String,
    required: true,
  },
  subscription: {
    status: {
      type: String,
      required: false,
      enum: ["active", "past_due"],
      default: () => null,
    },
    subscription_id: {
      type: String,
      required: false,
      default: () => null,
    },
  },
  customer_id: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
    default: () => {
      const date = new Date();
      date.setHours(date.getHours() + 1); // So the time is in UTC +1 (sweden time)
      return date;
    },
  },
});

export const User = model<IUser>("User", schema);
export type { IUser };
