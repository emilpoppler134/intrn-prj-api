import { Schema, model, Types } from 'mongoose';

type IUser = {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password_hash: string;
  timestamp: Date;
}

const schema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    password_hash: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      required: true,
      default: () => {
        const date = new Date();
        date.setHours(date.getHours() + 1); // So the time is in UTC +1 (sweden time)
        return date;
      }
    }
  }
);

export const User = model<IUser>('User', schema);
export type { IUser };