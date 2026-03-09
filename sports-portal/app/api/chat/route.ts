import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import { Bot } from '@/lib/models/Bot'

const MAX_BODY_BYTES = 50 * 1024

export async function POST(req: Request) {
  // Fast-path: reject oversized bodies before buffering
  const contentLength = req.headers.get('content-length')
  if (contentLength && parseInt(contentLength) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
  }

  const raw = await req.text()
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
  }

  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { bot_id, messages } = body as Record<string, unknown>

  if (!bot_id || typeof bot_id !== 'string') {
    return NextResponse.json({ error: 'bot_id is required' }, { status: 400 })
  }
  if (!Array.isArray(messages)) {
    return NextResponse.json({ error: 'messages must be an array' }, { status: 400 })
  }
  if (!mongoose.Types.ObjectId.isValid(bot_id)) {
    return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
  }

  try {
    await connectDB()
    const bot = await Bot.findById(bot_id)
    if (!bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
    }

    let botRes: globalThis.Response
    try {
      botRes = await fetch(bot.bot_endpoint_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      })
    } catch {
      return NextResponse.json({ error: 'Bot endpoint unreachable' }, { status: 502 })
    }

    if (!botRes.ok) {
      return NextResponse.json({ error: 'Bot endpoint error' }, { status: 502 })
    }

    return new Response(botRes.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
