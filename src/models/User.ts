import { Schema, model, Types } from 'mongoose';

type IUser = {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password_hash: string;
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
    password_hash: 
    {
      type: String,
      required: true
    }
  }
);

export const User = model<IUser>('User', schema);
export type { IUser };