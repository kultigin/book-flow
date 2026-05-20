import { requireAuth } from '@/lib/auth'
import { sql } from '@/lib/db'
import { TreatmentsManager } from '@/components/dashboard/treatments-manager'

interface Treatment {
  id: string
  business_id: string
  expert_id: string
  expert_name: string
  name: string
  duration_minutes: number
  price: number | null
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

interface Expert {
  id: string
  name: string
}

async function getTreatments(businessId: string, role: string, accountHolderId: string) {
  if (role === 'admin') {
    return sql`
      SELECT t.*, ah.name as expert_name
      FROM treatments t
      JOIN account_holders ah ON t.expert_id = ah.id
      WHERE t.business_id = ${businessId}
      ORDER BY ah.name, t.name
    `
  }
  return sql`
    SELECT t.*, ah.name as expert_name
    FROM treatments t
    JOIN account_holders ah ON t.expert_id = ah.id
    WHERE t.business_id = ${businessId} AND t.expert_id = ${accountHolderId}
    ORDER BY t.name
  `
}

async function getExperts(businessId: string) {
  return sql`
    SELECT id, name FROM account_holders
    WHERE business_id = ${businessId}
    ORDER BY name
  `
}

export default async function TreatmentsPage() {
  const { accountHolder } = await requireAuth()
  const isAdmin = accountHolder.role === 'admin'

  const [treatments, experts] = await Promise.all([
    getTreatments(accountHolder.business_id, accountHolder.role, accountHolder.id) as Promise<Treatment[]>,
    isAdmin ? getExperts(accountHolder.business_id) as Promise<Expert[]> : Promise.resolve([] as Expert[]),
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
        initialTreatments={treatments}
        experts={experts}
        currentUserId={accountHolder.id}
        isAdmin={isAdmin}
      />
    </div>
  )
}
