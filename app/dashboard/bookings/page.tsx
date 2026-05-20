export const dynamic = 'force-dynamic'

import { requireAuth } from '@/lib/auth'
import { sql } from '@/lib/db'
import { BookingsList } from '@/components/dashboard/bookings-list'
import { CreateBookingDialog } from '@/components/dashboard/create-booking-dialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

async function getBookings(businessId: string, accountHolderId: string, isAdmin: boolean) {
  if (isAdmin) {
    return sql`
      SELECT
        b.id, b.date::text as date, b.start_time::text as start_time, b.end_time::text as end_time, b.status,
        c.name as client_name, c.phone as client_phone, c.email as client_email,
        b.notes, ah.name as created_by_name,
        t.name as treatment_name,
        expert.name as expert_name, b.expert_id
      FROM bookings b
      JOIN clients c ON b.client_id = c.id
      LEFT JOIN account_holders ah ON b.created_by_account_holder_id = ah.id
      LEFT JOIN treatments t ON b.treatment_id = t.id
      LEFT JOIN account_holders expert ON b.expert_id = expert.id
      WHERE b.business_id = ${businessId}
      ORDER BY b.date DESC, b.start_time DESC
      LIMIT 50
    `
  }

  return sql`
    SELECT
      b.id, b.date::text as date, b.start_time::text as start_time, b.end_time::text as end_time, b.status,
      CASE WHEN b.expert_id IS NULL OR b.expert_id = ${accountHolderId}::uuid
        THEN c.name ELSE 'Reservado' END as client_name,
      CASE WHEN b.expert_id IS NULL OR b.expert_id = ${accountHolderId}::uuid
        THEN c.phone ELSE NULL END as client_phone,
      CASE WHEN b.expert_id IS NULL OR b.expert_id = ${accountHolderId}::uuid
        THEN c.email ELSE NULL END as client_email,
      CASE WHEN b.expert_id IS NULL OR b.expert_id = ${accountHolderId}::uuid
        THEN b.notes ELSE NULL END as notes,
      CASE WHEN b.expert_id IS NULL OR b.expert_id = ${accountHolderId}::uuid
        THEN ah.name ELSE NULL END as created_by_name,
      CASE WHEN b.expert_id IS NULL OR b.expert_id = ${accountHolderId}::uuid
        THEN t.name ELSE NULL END as treatment_name,
      expert.name as expert_name, b.expert_id
    FROM bookings b
    JOIN clients c ON b.client_id = c.id
    LEFT JOIN account_holders ah ON b.created_by_account_holder_id = ah.id
    LEFT JOIN treatments t ON b.treatment_id = t.id
    LEFT JOIN account_holders expert ON b.expert_id = expert.id
    WHERE b.business_id = ${businessId}
    ORDER BY b.date DESC, b.start_time DESC
    LIMIT 50
  `
}

async function getExperts(businessId: string) {
  return sql`
    SELECT id, name, slug FROM account_holders
    WHERE business_id = ${businessId} AND is_active = true
    ORDER BY name
  `
}

async function getTreatments(businessId: string) {
  return sql`
    SELECT id, expert_id, name, duration_minutes
    FROM treatments
    WHERE business_id = ${businessId} AND is_active = true
    ORDER BY name
  `
}

export default async function BookingsPage() {
  const { accountHolder } = await requireAuth()
  const isAdmin = accountHolder.role === 'admin'
  const [bookings, experts, treatments] = await Promise.all([
    getBookings(accountHolder.business_id, accountHolder.id, isAdmin),
    getExperts(accountHolder.business_id),
    getTreatments(accountHolder.business_id),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reservas</h1>
          <p className="text-muted-foreground">Gestiona todas las reservas de tu negocio</p>
        </div>
        <CreateBookingDialog
          businessId={accountHolder.business_id}
          accountHolderId={accountHolder.id}
          isAdmin={isAdmin}
          experts={experts}
          treatments={treatments}
        >
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva reserva
          </Button>
        </CreateBookingDialog>
      </div>

      <BookingsList bookings={bookings} currentUserId={accountHolder.id} isAdmin={accountHolder.role === 'admin'} />
    </div>
  )
}
