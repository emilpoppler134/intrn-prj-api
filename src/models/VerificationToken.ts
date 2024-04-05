import { Schema, model, Types } from "mongoose";

type IVerificationToken = {
  _id: Types.ObjectId;
  user?: Types.ObjectId;
  email?: string;
  code: number;
  consumed: boolean;
  expiry_date: Date;
  timestamp: Date;
};

const schema = new Schema<IVerificationToken>({
  user: {
    type: Schema.Types.ObjectId,
    required: false,
    ref: "User",
  },
  email: {
    type: String,
    required: true,
    ref: "User",
  },
  code: {
    type: Number,
    required: true,
  },
  consumed: {
    type: Boolean,
    required: true,
    default: () => false,
  },
  expiry_date: {
    type: Date,
    required: true,
    default: () => {
      const date = new Date();
      date.setHours(date.getHours() + 1); // So it expires in UTC +1 (sweden time)
      date.setMinutes(date.getMinutes() + 5); // Expires 5 minutes after creation
      return date;
    },
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

export const VerificationToken = model<IVerificationToken>(
  "Verification_Token",
  schema,
);
