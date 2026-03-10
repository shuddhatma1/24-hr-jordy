import { auth } from '@/auth'
import DashboardShell from '@/components/dashboard/DashboardShell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  const userEmail = session?.user?.email ?? ''

  return <DashboardShell userEmail={userEmail}>{children}</DashboardShell>
}
