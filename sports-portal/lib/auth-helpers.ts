import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/lib/models/User'

// Prevents timing oracle: ensures login always takes ~bcrypt time regardless of email existence
const DUMMY_HASH = '$2a$12$dummyhashtopreventtimingattacksxxxxxxxxxxxxxxxxxxxxxxxxxxx'

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
