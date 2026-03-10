import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import DashboardShell from '@/components/dashboard/DashboardShell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  // Defensive check — middleware should redirect first, but this ensures
  // the layout never renders without a valid session if middleware is bypassed.
  if (!session?.user) redirect('/login')

  const userEmail = session.user.email ?? ''

  return <DashboardShell userEmail={userEmail}>{children}</DashboardShell>
}
