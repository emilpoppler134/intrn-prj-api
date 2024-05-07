import { Schema, Types, model } from "mongoose";

type IPrompt = {
  _id: Types.ObjectId;
  name: string;
  subject: string;
  placeholder: string;
};

const schema = new Schema<IPrompt>({
  name: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  placeholder: {
    type: String,
    required: true,
  },
});

export const Prompt = model<IPrompt>("Prompt", schema);
export type { IPrompt };
