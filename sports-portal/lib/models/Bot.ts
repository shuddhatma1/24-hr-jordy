import { Schema, model, models } from 'mongoose'

const BotSchema = new Schema({
  owner_id: { type: String, required: true },
  bot_name: { type: String, required: true },
  sport: { type: String, required: true },
  league: { type: String, required: true },
  bot_endpoint_url: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
})

export const Bot = models.Bot || model('Bot', BotSchema)
