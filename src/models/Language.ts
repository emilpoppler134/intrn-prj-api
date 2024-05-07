import { Schema, Types, model } from "mongoose";

type ILanguage = {
  _id: Types.ObjectId;
  title: string;
  name: string;
  country_code: string;
};

const schema = new Schema<ILanguage>({
  title: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    enum: ["english", "swedish"],
  },
  country_code: {
    type: String,
    required: true,
  },
});

export const Language = model<ILanguage>("Language", schema);
export type { ILanguage };
