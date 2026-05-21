import { requireAuth } from '@/lib/auth'
import { sql } from '@/lib/db'
import { TreatmentsManager } from '@/components/dashboard/treatments-manager'

async function getTreatments(businessId: string, role: string, accountHolderId: string) {
  if (role === 'admin') {
    return sql`
      SELECT t.*, ah.name as expert_name,
        COALESCE(
          json_agg(
            json_build_object('id', ts.id, 'day_of_week', ts.day_of_week, 'start_time', ts.start_time::text)
            ORDER BY ts.day_of_week, ts.start_time
          ) FILTER (WHERE ts.id IS NOT NULL),
          '[]'::json
        ) as schedules
      FROM treatments t
      JOIN account_holders ah ON t.expert_id = ah.id
      LEFT JOIN treatment_schedules ts ON ts.treatment_id = t.id
      WHERE t.business_id = ${businessId}
      GROUP BY t.id, ah.name
      ORDER BY ah.name, t.name
    `
  }
  return sql`
    SELECT t.*, ah.name as expert_name,
      COALESCE(
        json_agg(
          json_build_object('id', ts.id, 'day_of_week', ts.day_of_week, 'start_time', ts.start_time::text)
          ORDER BY ts.day_of_week, ts.start_time
        ) FILTER (WHERE ts.id IS NOT NULL),
        '[]'::json
      ) as schedules
    FROM treatments t
    JOIN account_holders ah ON t.expert_id = ah.id
    LEFT JOIN treatment_schedules ts ON ts.treatment_id = t.id
    WHERE t.business_id = ${businessId} AND t.expert_id = ${accountHolderId}
    GROUP BY t.id, ah.name
    ORDER BY t.name
  `
}

async function getExperts(businessId: string) {
  return sql`SELECT id, name FROM account_holders WHERE business_id = ${businessId} ORDER BY name`
}

export default async function TreatmentsPage() {
  const { accountHolder } = await requireAuth()
  const isAdmin = accountHolder.role === 'admin'

  const [treatments, experts] = await Promise.all([
    getTreatments(accountHolder.business_id, accountHolder.role, accountHolder.id),
    isAdmin ? getExperts(accountHolder.business_id) : Promise.resolve([]),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tratamientos</h1>
        <p className="text-muted-foreground">
          {isAdmin ? 'Gestiona los tratamientos de todos los expertos' : 'Gestiona tus tratamientos'}
        </p>
      </div>

      <TreatmentsManager
        initialTreatments={treatments as any}
        experts={experts as any}
        currentUserId={accountHolder.id}
        isAdmin={isAdmin}
      />
    </div>
  )
}
