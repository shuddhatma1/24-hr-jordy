import { Schema, model, models, type Document } from 'mongoose'

export interface IUser extends Document {
  email: string
  passwordHash: string
  createdAt: Date
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
  },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: () => new Date() },
})

export const User = models.User || model<IUser>('User', UserSchema)
