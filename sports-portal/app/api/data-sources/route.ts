import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectDB } from '@/lib/mongodb'
import { Bot } from '@/lib/models/Bot'
import { DataSource } from '@/lib/models/DataSource'

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await connectDB()

    const bot = await Bot.findOne({ owner_id: session.user.id })
    if (!bot) {
      return NextResponse.json({ error: 'No bot found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const typeFilter = searchParams.get('type')

    const query: Record<string, unknown> = { owner_id: session.user.id }
    if (typeFilter === 'faq' || typeFilter === 'file') {
      query.type = typeFilter
    }

    const sources = await DataSource.find(query).sort({ created_at: -1 })

    return NextResponse.json(
      sources.map((s) => ({
        id: s._id.toString(),
        type: s.type,
        title: s.title,
        content: s.content,
        file_size: s.file_size ?? null,
        original_filename: s.original_filename ?? null,
        created_at: s.created_at,
      }))
    )
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { title, content } = body as Record<string, unknown>

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }
  if (title.trim().length > 200) {
    return NextResponse.json(
      { error: 'Title must be 200 characters or less' },
      { status: 400 }
    )
  }
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 })
  }
  if (content.trim().length > 50000) {
    return NextResponse.json(
      { error: 'Content must be 50,000 characters or less' },
      { status: 400 }
    )
  }

  try {
    await connectDB()

    const bot = await Bot.findOne({ owner_id: session.user.id })
    if (!bot) {
      return NextResponse.json({ error: 'No bot found' }, { status: 404 })
    }

    const source = await DataSource.create({
      owner_id: session.user.id,
      bot_id: bot._id.toString(),
      type: 'faq',
      title: title.trim(),
      content: content.trim(),
    })

    return NextResponse.json(
      {
        id: source._id.toString(),
        type: source.type,
        title: source.title,
        content: source.content,
        file_size: null,
        original_filename: null,
        created_at: source.created_at,
      },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
