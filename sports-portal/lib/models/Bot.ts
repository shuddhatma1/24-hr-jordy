import { Schema, model, models, type Document } from 'mongoose'

export interface IBot extends Document {
  owner_id: string
  bot_name: string
  sport: string
  league: string
  bot_endpoint_url: string
  created_at: Date
  welcome_message?: string
  persona?: 'friendly' | 'professional' | 'enthusiastic'
  primary_color?: string
}

const BotSchema = new Schema<IBot>({
  owner_id: { type: String, required: true, unique: true },
  bot_name: { type: String, required: true, maxlength: 100 },
  sport: { type: String, required: true },
  league: { type: String, required: true },
  bot_endpoint_url: { type: String, required: true },
  created_at: { type: Date, default: () => new Date() },
  welcome_message: { type: String, maxlength: 300 },
  persona: { type: String, enum: ['friendly', 'professional', 'enthusiastic'] },
  primary_color: { type: String, match: /^#[0-9A-Fa-f]{6}$/ },
})

export const Bot = models.Bot || model<IBot>('Bot', BotSchema)
