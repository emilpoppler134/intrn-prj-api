import { Schema, model, Types } from 'mongoose';

type IResetPasswordToken = {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  code: number;
  consumed: boolean;
  expiry_date: Date;
  timestamp: Date;
}

const schema = new Schema<IResetPasswordToken>(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    },
    code: {
      type: Number,
      required: true
    },
    consumed: {
      type: Boolean,
      required: true,
      default: () => false
    },
    expiry_date: {
      type: Date,
      required: true,
      default: () => {
        const date = new Date();
        date.setHours(date.getHours() + 1); // So it expires in UTC +1 (sweden time)
        date.setMinutes(date.getMinutes() + 5); // Expires 5 minutes after creation
        return date;
      }
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

export const ResetPasswordToken = model<IResetPasswordToken>('Reset_Password_Token', schema);
export type { IResetPasswordToken };