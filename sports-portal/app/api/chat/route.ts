import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import { Bot } from '@/lib/models/Bot'
import { DataSource } from '@/lib/models/DataSource'

const MAX_BODY_BYTES = 50 * 1024
const MAX_SYSTEM_CONTEXT_CHARS = 100_000
const BOT_FETCH_TIMEOUT_MS = 30_000
const ALLOWED_ROLES = new Set(['user', 'assistant', 'system'])

function isValidMessage(m: unknown): m is { role: string; content: string } {
  return (
    !!m &&
    typeof m === 'object' &&
    !Array.isArray(m) &&
    typeof (m as Record<string, unknown>).role === 'string' &&
    ALLOWED_ROLES.has((m as Record<string, unknown>).role as string) &&
    typeof (m as Record<string, unknown>).content === 'string'
  )
}

export async function POST(req: Request) {
  // Fast-path: reject oversized bodies before buffering
  const contentLength = req.headers.get('content-length')
  if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
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

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { bot_id, messages } = body as Record<string, unknown>

  if (!bot_id || typeof bot_id !== 'string') {
    return NextResponse.json({ error: 'bot_id is required' }, { status: 400 })
  }
  if (!Array.isArray(messages)) {
    return NextResponse.json({ error: 'messages must be an array' }, { status: 400 })
  }
  if (!messages.every(isValidMessage)) {
    return NextResponse.json(
      { error: 'Each message must have a valid role and content string' },
      { status: 400 }
    )
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

    let system_context = ''
    try {
      const dataSources = await DataSource.find({ bot_id: bot._id.toString() })
      if (dataSources.length > 0) {
        const raw_context = dataSources
          .map((ds) => `${ds.title}:\n${ds.content}`)
          .join('\n\n---\n\n')
        system_context = raw_context.slice(0, MAX_SYSTEM_CONTEXT_CHARS)
      }
    } catch {
      // Non-fatal — continue without context
    }

    let botRes: globalThis.Response
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), BOT_FETCH_TIMEOUT_MS)
    try {
      botRes = await fetch(bot.bot_endpoint_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, system_context }),
        signal: controller.signal,
      })
    } catch {
      return NextResponse.json({ error: 'Bot endpoint unreachable' }, { status: 502 })
    } finally {
      clearTimeout(timeout)
    }

    if (!botRes.ok) {
      return NextResponse.json({ error: 'Bot endpoint error' }, { status: 502 })
    }

    if (!botRes.body) {
      return NextResponse.json({ error: 'Bot endpoint error' }, { status: 502 })
    }

    return new Response(botRes.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
