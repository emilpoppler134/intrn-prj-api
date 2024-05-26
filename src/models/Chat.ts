import { Message } from "ai";
import { Schema, Types, model } from "mongoose";
import { formatUnixDateTime } from "../utils/formatUnixDate.js";

type IChat = {
  _id: Types.ObjectId;
  name: string;
  user: Types.ObjectId;
  bot: Types.ObjectId;
  messages: Array<MessageItem>;
  timestamp: number;
};

type MessageItem = {
  sender: "user" | "bot";
  message: Message;
  timestamp: number;
};

const schema = new Schema<IChat>({
  name: {
    type: String,
    required: false,
    default: () => {
      const date = new Date();
      return formatUnixDateTime(Math.floor(date.getTime() / 1000));
    },
  },
  user: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  bot: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Bot",
  },
  messages: [
    {
      sender: {
        type: String,
        required: true,
        enum: ["user", "bot"],
      },
      message: {
        type: String,
        required: true,
      },
      timestamp: {
        type: Number,
        required: false,
        default: () => {
          const date = new Date();
          date.setHours(date.getHours() + 1); // So the time is in UTC +1 (sweden time)
          return Math.floor(date.getTime() / 1000);
        },
      },
    },
  ],
  timestamp: {
    type: Number,
    required: false,
    default: () => {
      const date = new Date();
      date.setHours(date.getHours() + 1); // So the time is in UTC +1 (sweden time)
      return Math.floor(date.getTime() / 1000);
    },
  },
});

export const Chat = model<IChat>("Chat", schema);
export type { IChat };
