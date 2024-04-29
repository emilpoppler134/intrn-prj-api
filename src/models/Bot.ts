import { Schema, Types, model } from "mongoose";

type IBot = {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  name: string;
  photo: string;
  system_prompt: string;
  model: Types.ObjectId;
  maxTokens: number;
  temperature: number;
  topP: number;
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
  photo: {
    type: String,
    required: false,
  },
  system_prompt: {
    type: String,
    required: true,
  },
  model: {
    type: Schema.Types.ObjectId,
    required: false,
    ref: "Model",
    default: () => new Types.ObjectId("662a4dc2813159e3db48a0b1"),
  },
  maxTokens: {
    type: Number,
    required: false,
    default: () => 800,
  },
  temperature: {
    type: Number,
    required: false,
    default: () => 0.75,
  },
  topP: {
    type: Number,
    required: false,
    default: () => 0.9,
  },
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
export type { IBot };
