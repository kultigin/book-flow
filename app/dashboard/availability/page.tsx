import { requireAuth } from '@/lib/auth'
import { sql } from '@/lib/db'
import { AvailabilityManager } from '@/components/dashboard/availability-manager'
import { BlockedDatesManager } from '@/components/dashboard/blocked-dates-manager'

async function getAvailability(businessId: string) {
  const availability = await sql`
    SELECT * FROM availability WHERE business_id = ${businessId} ORDER BY day_of_week
  `
  return availability
}

async function getBlockedDates(businessId: string) {
  const today = new Date().toISOString().split('T')[0]
  const blockedDates = await sql`
    SELECT * FROM blocked_dates 
    WHERE business_id = ${businessId} AND date >= ${today}
    ORDER BY date
  `
  return blockedDates
}

export default async function AvailabilityPage() {
  const { accountHolder } = await requireAuth()
  const [availability, blockedDates] = await Promise.all([
    getAvailability(accountHolder.business_id),
    getBlockedDates(accountHolder.business_id)
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Disponibilidad</h1>
        <p className="text-muted-foreground">
          Configura los horarios de atencion y dias bloqueados
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AvailabilityManager 
          businessId={accountHolder.business_id}
          initialAvailability={availability}
        />
        <BlockedDatesManager 
          businessId={accountHolder.business_id}
          initialBlockedDates={blockedDates}
        />
      </div>
    </div>
  )
}
