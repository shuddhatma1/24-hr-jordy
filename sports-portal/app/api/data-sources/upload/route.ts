import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectDB } from '@/lib/mongodb'
import { Bot } from '@/lib/models/Bot'
import { DataSource } from '@/lib/models/DataSource'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.csv', '.txt'])

function getExtension(filename: string): string {
  const idx = filename.lastIndexOf('.')
  return idx !== -1 ? filename.slice(idx).toLowerCase() : ''
}

async function extractText(file: File, ext: string): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())

  if (ext === '.txt' || ext === '.csv') {
    return buffer.toString('utf-8')
  }

  if (ext === '.pdf') {
    const pdfParse = (await import('pdf-parse')).default
    const result = await pdfParse(buffer)
    return result.text
  }

  throw new Error('Unsupported file type')
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const ext = getExtension(file.name)
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return NextResponse.json(
      { error: 'Only PDF, CSV, and TXT files are supported' },
      { status: 400 }
    )
  }

  if (file.size === 0) {
    return NextResponse.json({ error: 'File is empty' }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: 'File must be 5MB or less' },
      { status: 400 }
    )
  }

  let extractedText: string
  try {
    extractedText = await extractText(file, ext)
  } catch {
    return NextResponse.json(
      { error: 'Failed to extract text from file' },
      { status: 422 }
    )
  }

  if (!extractedText.trim()) {
    return NextResponse.json(
      { error: 'No text could be extracted from this file' },
      { status: 422 }
    )
  }

  // Cap extracted text to prevent oversized DB documents and system_context payloads
  if (extractedText.length > 50000) {
    extractedText = extractedText.slice(0, 50000)
  }

  try {
    await connectDB()

    const bot = await Bot.findOne({ owner_id: session.user.id })
    if (!bot) {
      return NextResponse.json({ error: 'No bot found' }, { status: 404 })
    }

    // Sanitize filename: strip path separators, truncate to schema maxlength
    const safeName = file.name.replace(/[\\/]/g, '_').slice(0, 200)

    const source = await DataSource.create({
      owner_id: session.user.id,
      bot_id: bot._id.toString(),
      type: 'file',
      title: safeName,
      content: extractedText,
      file_size: file.size,
      original_filename: safeName,
    })

    return NextResponse.json(
      {
        id: source._id.toString(),
        type: source.type,
        title: source.title,
        content: source.content,
        file_size: source.file_size ?? null,
        original_filename: source.original_filename ?? null,
        created_at: source.created_at,
      },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
