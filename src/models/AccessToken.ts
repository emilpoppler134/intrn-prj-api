import { Schema, model, Types } from 'mongoose';

type IAccessToken = {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  token: string;
  expiry_date: Date;
  timestamp: Date;
}

const schema = new Schema<IAccessToken>(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    },
    token: {
      type: String,
      required: true
    },
    expiry_date: 
    {
      type: Date,
      required: true,
      default: () => {
        const date = new Date();
        date.setHours(date.getHours() + 1); // So it expires in UTC +1 (sweden time)
        date.setDate(date.getDate() + 7); // Expires 7 days after creation
        return date;
      }
    },
    timestamp: 
    {
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

export const AccessToken = model<IAccessToken>('Access_Token', schema);
export type { IAccessToken };