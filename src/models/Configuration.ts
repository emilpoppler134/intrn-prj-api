import { Schema, Types, model } from "mongoose";

type IConfiguration = {
  _id: Types.ObjectId;
  name: string;
  title: string;
  description: string;
  data: DataConfig | null;
};

export type DataConfig = {
  maxTokens: number;
  temperature: number;
  topP: number;
};

const schema = new Schema<IConfiguration>({
  name: {
    type: String,
    required: true,
    enum: ["default", "advanced", "custom"],
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  data: {
    maxTokens: {
      type: Number,
      required: true,
    },
    temperature: {
      type: Number,
      required: true,
    },
    topP: {
      type: Number,
      required: true,
    },
  },
});

export const Configuration = model<IConfiguration>("Configuration", schema);
export type { IConfiguration };
