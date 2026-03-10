import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { auth } from '@/auth'
import { connectDB } from '@/lib/mongodb'
import { DataSource } from '@/lib/models/DataSource'

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = params

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  }

  try {
    await connectDB()

    const deleted = await DataSource.findOneAndDelete({
      _id: id,
      owner_id: session.user.id,
    })

    if (!deleted) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
