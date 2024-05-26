import { Schema, Types, model } from "mongoose";

type IBot = {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  name: string;
  photo: string | null;
  language: Types.ObjectId;
  prompts: Array<PromptItem>;
  model: Types.ObjectId;
  configuration: Types.ObjectId;
  maxTokens: number | null;
  temperature: number | null;
  topP: number | null;
  files: Array<FileItem>;
  chats: Array<Types.ObjectId>;
  timestamp: Date;
};

export type PromptItem = {
  option: Types.ObjectId;
  value: string;
};

export type FileItem = {
  _id: Types.ObjectId;
  key: string;
  name: string;
  type: string;
  size: number;
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
    default: () => null,
  },
  language: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Language",
  },
  prompts: [
    {
      option: {
        type: Schema.Types.ObjectId,
        required: true,
      },
      value: {
        type: String,
        required: true,
      },
    },
  ],
  model: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Model",
  },
  configuration: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Configuration",
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
  files: [
    {
      key: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        required: true,
      },
      size: {
        type: Number,
        required: true,
      },
    },
  ],
  chats: [
    {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Chat",
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
export type { IBot };
