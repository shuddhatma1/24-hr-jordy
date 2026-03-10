import { Schema, model, models, Document } from 'mongoose'

export interface IDataSource extends Document {
  owner_id: string
  bot_id: string
  type: 'faq' | 'file'
  title: string
  content: string
  file_size?: number
  original_filename?: string
  created_at: Date
}

const DataSourceSchema = new Schema<IDataSource>({
  owner_id: { type: String, required: true },
  bot_id:   { type: String, required: true, index: true },
  type:     { type: String, required: true, enum: ['faq', 'file'] },
  title:    { type: String, required: true, maxlength: 200 },
  content:  { type: String, required: true },
  file_size:         { type: Number },
  original_filename: { type: String },
  created_at: { type: Date, default: () => new Date() },
})

export const DataSource =
  models.DataSource || model<IDataSource>('DataSource', DataSourceSchema)
