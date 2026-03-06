import { Schema, model, models, type Document } from 'mongoose'

export interface IBot extends Document {
  owner_id: string
  bot_name: string
  sport: string
  league: string
  bot_endpoint_url: string
  created_at: Date
}

const BotSchema = new Schema<IBot>({
  owner_id: { type: String, required: true, unique: true },
  bot_name: { type: String, required: true },
  sport: { type: String, required: true },
  league: { type: String, required: true },
  bot_endpoint_url: { type: String, required: true },
  created_at: { type: Date, default: () => new Date() },
})

export const Bot = models.Bot || model<IBot>('Bot', BotSchema)
