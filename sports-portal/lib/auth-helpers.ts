import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/lib/models/User'

// Prevents timing oracle: ensures login always takes ~bcrypt time regardless of email existence.
// Must be a valid bcrypt hash (60 chars) — an invalid hash causes bcryptjs to return false
// immediately without doing the full round, defeating the constant-time goal.
// Generated with: await bcrypt.hash('dummy', 12)
const DUMMY_HASH = '$2b$12$/kHqteN3pPH/PhOcNNLAseozx.Q.OGGBXn6Cdx5GdIGu.ji7oCOme'

/**
 * Validates credentials against the database.
 * Returns { id, email } on success, null on failure.
 * Always runs bcrypt.compare to prevent timing-based email enumeration.
 */
export async function validateCredentials(
  email: string,
  password: string
): Promise<{ id: string; email: string } | null> {
  await connectDB()
  const user = await User.findOne({ email: email.toLowerCase() })
  if (!user) {
    await bcrypt.compare(password, DUMMY_HASH)
    return null
  }
  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) return null
  return { id: user._id.toString(), email: user.email }
}
