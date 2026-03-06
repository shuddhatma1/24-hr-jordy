import { Schema, model, models } from 'mongoose'

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
})

export const User = models.User || model('User', UserSchema)
