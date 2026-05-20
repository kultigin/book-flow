export const dynamic = 'force-dynamic'

import { requireAuth } from '@/lib/auth'
import { sql } from '@/lib/db'
import { ClientsList } from '@/components/dashboard/clients-list'

async function getClients(businessId: string, accountHolderId: string, isAdmin: boolean) {
  if (isAdmin) {
    return sql`
      SELECT c.id, c.name, c.phone, c.email, c.created_at,
        COUNT(b.id) as total_bookings,
        MAX(b.date) as last_booking
      FROM clients c
      LEFT JOIN bookings b ON c.id = b.client_id AND b.status != 'cancelled' AND b.business_id = ${businessId}
      WHERE EXISTS (SELECT 1 FROM bookings WHERE client_id = c.id AND business_id = ${businessId})
      GROUP BY c.id
      ORDER BY c.created_at DESC
      LIMIT 100
    `
  }

  return sql`
    SELECT c.id, c.name, c.phone, c.email, c.created_at,
      COUNT(b.id) as total_bookings,
      MAX(b.date) as last_booking
    FROM clients c
    JOIN bookings b ON c.id = b.client_id AND b.status != 'cancelled'
      AND b.business_id = ${businessId}
      AND (b.expert_id IS NULL OR b.expert_id = ${accountHolderId}::uuid)
    GROUP BY c.id
    ORDER BY c.created_at DESC
    LIMIT 100
  `
}

export default async function ClientsPage() {
  const { accountHolder } = await requireAuth()
  const isAdmin = accountHolder.role === 'admin'
  const clients = await getClients(accountHolder.business_id, accountHolder.id, isAdmin)

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
