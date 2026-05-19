import { requireAuth } from '@/lib/auth'
import { sql } from '@/lib/db'
import { BookingsList } from '@/components/dashboard/bookings-list'
import { CreateBookingDialog } from '@/components/dashboard/create-booking-dialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

async function getBookings(businessId: string) {
  const bookings = await sql`
    SELECT b.*, c.name as client_name, c.phone as client_phone, c.email as client_email,
           ah.name as created_by_name
    FROM bookings b
    JOIN clients c ON b.client_id = c.id
    LEFT JOIN account_holders ah ON b.created_by_account_holder_id = ah.id
    WHERE b.business_id = ${businessId}
    ORDER BY b.date DESC, b.start_time DESC
    LIMIT 50
  `
  return bookings
}

export default async function BookingsPage() {
  const { accountHolder } = await requireAuth()
  const bookings = await getBookings(accountHolder.business_id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reservas</h1>
          <p className="text-muted-foreground">
            Gestiona todas las reservas de tu negocio
          </p>
        </div>
        <CreateBookingDialog businessId={accountHolder.business_id} accountHolderId={accountHolder.id}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva reserva
          </Button>
        </CreateBookingDialog>
      </div>

      <BookingsList bookings={bookings} />
    </div>
  )
}
