import { requireAuth } from '@/lib/auth'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { accountHolder } = await requireAuth()

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar accountHolder={accountHolder} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader accountHolder={accountHolder} />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
