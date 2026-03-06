import type mongoose from 'mongoose'

declare global {
  // eslint-disable-next-line no-var
  var _mongoose: {
    conn: typeof mongoose | null
    promise: Promise<typeof mongoose> | null
  }
}

export {}
