import { Schema, model, models, Document } from 'mongoose'

export interface IChatEvent extends Document {
  bot_id: string
  owner_id: string
  event_type: 'conversation_start' | 'message'
  message_role: 'user'
  created_at: Date
}

const ChatEventSchema = new Schema<IChatEvent>({
  bot_id:       { type: String, required: true },
  owner_id:     { type: String, required: true },
  event_type:   { type: String, required: true, enum: ['conversation_start', 'message'] },
  message_role: { type: String, required: true, enum: ['user'] },
  created_at:   { type: Date, default: () => new Date(), expires: 90 * 86400 },
})

ChatEventSchema.index({ bot_id: 1, created_at: -1 })
ChatEventSchema.index({ owner_id: 1, created_at: -1 })

export const ChatEvent =
  models.ChatEvent || model<IChatEvent>('ChatEvent', ChatEventSchema)
