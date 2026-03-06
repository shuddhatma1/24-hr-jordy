import mongoose from 'mongoose'

const cached = global._mongoose ?? (global._mongoose = { conn: null, promise: null })

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set')
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI).catch((err) => {
      cached.promise = null
      throw err
    })
  }

  cached.conn = await cached.promise
  return cached.conn
}
