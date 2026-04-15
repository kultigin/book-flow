import { requireAuth } from '@/lib/auth'
import { sql } from '@/lib/db'
import { CalendarView } from '@/components/dashboard/calendar-view'

async function getMonthBookings(businessId: string, year: number, month: number) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = `${year}-${String(month + 1).padStart(2, '0')}-01`
  
  const bookings = await sql`
    SELECT b.*, c.name as client_name, c.phone as client_phone
    FROM bookings b
    JOIN clients c ON b.client_id = c.id
    WHERE b.business_id = ${businessId}
      AND b.date >= ${startDate}
      AND b.date < ${endDate}
      AND b.status IN ('confirmed', 'pending')
    ORDER BY b.date, b.start_time
  `
  
  return bookings
}

export default async function CalendarPage() {
  const { accountHolder } = await requireAuth()
  const now = new Date()
  const bookings = await getMonthBookings(
    accountHolder.business_id, 
    now.getFullYear(), 
    now.getMonth() + 1
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
