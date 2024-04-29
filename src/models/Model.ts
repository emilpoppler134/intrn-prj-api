import { Schema, Types, model } from "mongoose";

type IModel = {
  _id: Types.ObjectId;
  title: string;
  name: string;
  description: string;
};

const schema = new Schema<IModel>({
  title: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
});

export const Model = model<IModel>("Model", schema);
export type { IModel };
