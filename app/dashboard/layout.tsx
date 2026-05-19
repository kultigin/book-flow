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
      <DashboardSidebar name={accountHolder.name}  role={accountHolder.role}/>
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader name={accountHolder.name} email={accountHolder.email} />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
