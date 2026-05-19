import { requireAuth } from '@/lib/auth'
import { sql } from '@/lib/db'
import { ClientsList } from '@/components/dashboard/clients-list'

async function getClients(businessId: string) {
  const clients = await sql`
    SELECT 
      c.*,
      COUNT(b.id) as total_bookings,
      MAX(b.date) as last_booking
    FROM clients c
    LEFT JOIN bookings b ON c.id = b.client_id AND b.status != 'cancelled'
    WHERE b.business_id = ${businessId}
    GROUP BY c.id
    ORDER BY c.created_at DESC
    LIMIT 100
  `
  return clients
}

export default async function ClientsPage() {
  const { accountHolder } = await requireAuth()
  const clients = await getClients(accountHolder.business_id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
        <p className="text-muted-foreground">
          Todos los clientes que han realizado reservas
        </p>
      </div>

      <ClientsList clients={clients} />
    </div>
  )
}
