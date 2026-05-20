import { requireAuth } from '@/lib/auth'
import { sql } from '@/lib/db'
import { ExpertAvailabilityManager } from '@/components/dashboard/expert-availability-manager'
import { ExpertBlockedDatesManager } from '@/components/dashboard/expert-blocked-dates-manager'

interface ExpertAvailability {
  id: string
  expert_id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
}

interface ExpertBlockedDate {
  id: string
  expert_id: string
  date: string
  reason?: string
}

async function getExpertAvailability(expertId: string) {
  return sql`
    SELECT * FROM expert_availability
    WHERE expert_id = ${expertId}
    ORDER BY day_of_week
  `
}

async function getExpertBlockedDates(expertId: string) {
  const today = new Date().toISOString().split('T')[0]
  return sql`
    SELECT * FROM expert_blocked_dates
    WHERE expert_id = ${expertId} AND date >= ${today}
    ORDER BY date
  `
}

export default async function MyAvailabilityPage() {
  const { accountHolder } = await requireAuth()

  const [availability, blockedDates] = await Promise.all([
    getExpertAvailability(accountHolder.id) as Promise<ExpertAvailability[]>,
    getExpertBlockedDates(accountHolder.id) as Promise<ExpertBlockedDate[]>,
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mi disponibilidad</h1>
        <p className="text-muted-foreground">
          Configura tus horarios de trabajo y dias en los que no estars disponible
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ExpertAvailabilityManager initialAvailability={availability} />
        <ExpertBlockedDatesManager initialBlockedDates={blockedDates} />
      </div>
    </div>
  )
}
