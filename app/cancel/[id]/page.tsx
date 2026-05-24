import { sql } from '@/lib/db'
import { notFound } from 'next/navigation'
import { CancelBookingForm } from '@/components/public/cancel-booking-form'

async function getBooking(id: string) {
  const rows = await sql`
    SELECT b.id, b.date::text as date, b.start_time::text as start_time, b.status,
           t.name as treatment_name, ah.name as expert_name, bus.name as business_name
    FROM bookings b
    JOIN businesses bus ON bus.id = b.business_id
    LEFT JOIN treatments t ON t.id = b.treatment_id
    LEFT JOIN account_holders ah ON ah.id = b.expert_id
    WHERE b.id = ${id}
  `
  return rows[0] || null
}

export default async function CancelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const booking = await getBooking(id)

  if (!booking) notFound()

  const formattedDate = new Date(booking.date + 'T00:00:00').toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const time = booking.start_time.slice(0, 5)

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="rounded-xl border bg-card p-6 space-y-6 shadow-sm">
          <div className="text-center space-y-1">
            <h1 className="text-xl font-semibold">Cancelar reserva</h1>
            <p className="text-sm text-muted-foreground">{booking.business_name}</p>
          </div>

          <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
            {booking.treatment_name && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Servicio</span>
                <span className="font-medium">{booking.treatment_name}</span>
              </div>
            )}
            {booking.expert_name && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Experto</span>
                <span className="font-medium">{booking.expert_name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha</span>
              <span className="font-medium capitalize">{formattedDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Hora</span>
              <span className="font-medium">{time}</span>
            </div>
          </div>

          {booking.status === 'cancelled' ? (
            <p className="text-center text-sm text-muted-foreground">Esta reserva ya ha sido cancelada.</p>
          ) : (
            <CancelBookingForm bookingId={id} />
          )}
        </div>
      </div>
    </div>
  )
}
