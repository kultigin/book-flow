export const dynamic = 'force-dynamic'

import { requireAuth } from '@/lib/auth'
import { sql } from '@/lib/db'
import { CalendarView } from '@/components/dashboard/calendar-view'

async function getMonthBookings(businessId: string, year: number, month: number, accountHolderId: string, isAdmin: boolean) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = `${year}-${String(month + 1).padStart(2, '0')}-01`

  if (isAdmin) {
    return sql`
      SELECT b.id, b.date::text as date, b.start_time::text as start_time, b.end_time::text as end_time, b.status,
        c.name as client_name, c.phone as client_phone,
        t.name as treatment_name, expert.name as expert_name
      FROM bookings b
      JOIN clients c ON b.client_id = c.id
      LEFT JOIN treatments t ON b.treatment_id = t.id
      LEFT JOIN account_holders expert ON b.expert_id = expert.id
      WHERE b.business_id = ${businessId}
        AND b.date >= ${startDate} AND b.date < ${endDate}
        AND b.status IN ('confirmed', 'pending_verification')
      ORDER BY b.date, b.start_time
    `
  }

  return sql`
    SELECT b.id, b.date::text as date, b.start_time::text as start_time, b.end_time::text as end_time, b.status,
      CASE WHEN b.expert_id IS NULL OR b.expert_id = ${accountHolderId}::uuid
        THEN c.name ELSE 'Reservado' END as client_name,
      CASE WHEN b.expert_id IS NULL OR b.expert_id = ${accountHolderId}::uuid
        THEN c.phone ELSE NULL END as client_phone,
      CASE WHEN b.expert_id IS NULL OR b.expert_id = ${accountHolderId}::uuid
        THEN t.name ELSE NULL END as treatment_name,
      expert.name as expert_name
    FROM bookings b
    JOIN clients c ON b.client_id = c.id
    LEFT JOIN treatments t ON b.treatment_id = t.id
    LEFT JOIN account_holders expert ON b.expert_id = expert.id
    WHERE b.business_id = ${businessId}
      AND b.date >= ${startDate} AND b.date < ${endDate}
      AND b.status IN ('confirmed', 'pending_verification')
    ORDER BY b.date, b.start_time
  `
}

export default async function CalendarPage() {
  const { accountHolder } = await requireAuth()
  const isAdmin = accountHolder.role === 'admin'
  const now = new Date()
  const bookings = await getMonthBookings(
    accountHolder.business_id,
    now.getFullYear(),
    now.getMonth() + 1,
    accountHolder.id,
    isAdmin
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Calendario</h1>
        <p className="text-muted-foreground">
          Vista mensual de todas las reservas
        </p>
      </div>

      <CalendarView
        businessId={accountHolder.business_id}
        initialBookings={bookings}
      />
    </div>
  )
}
