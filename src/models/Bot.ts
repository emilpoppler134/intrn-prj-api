import { Schema, model, Types } from "mongoose";

type IBot = {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  name: string;
  personality: string;
  photo: string;
  files: Array<string>;
  timestamp: Date;
};

const schema = new Schema<IBot>({
  name: {
    type: String,
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  personality: {
    type: String,
    required: false,
  },
  photo: {
    type: String,
    required: false,
  },
  files: [
    {
      type: String,
      required: false,
    },
  ],
  timestamp: {
    type: Date,
    required: false,
    default: () => {
      const date = new Date();
      date.setHours(date.getHours() + 1); // So the time is in UTC +1 (sweden time)
      return date;
    },
  },
});

export const Bot = model<IBot>("Bot", schema);
