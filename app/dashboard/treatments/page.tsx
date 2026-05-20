import { requireAuth } from '@/lib/auth'
import { sql } from '@/lib/db'
import { TreatmentsManager } from '@/components/dashboard/treatments-manager'

interface Treatment {
  id: string
  expert_id: string | null
  business_id: string
  name: string
  duration_minutes: number
  price: number | null
  description: string | null
  is_active: boolean
  created_at: string
}

interface Expert {
  id: string
  name: string
}

async function getTreatments(businessId: string): Promise<Treatment[]> {
  const treatments = await sql`
    SELECT * FROM treatments 
    WHERE business_id = ${businessId} 
    ORDER BY name
  `
  return treatments as Treatment[]
}

async function getExperts(businessId: string): Promise<Expert[]> {
  const experts = await sql`
    SELECT id, name FROM account_holders 
    WHERE business_id = ${businessId} AND role = 'staff'
    ORDER BY name
  `
  return experts as Expert[]
}

export default async function TreatmentsPage() {
  const { accountHolder } = await requireAuth()
  
  if (accountHolder.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No tienes permisos para acceder a esta pagina</p>
      </div>
    )
  }

  const [treatments, experts] = await Promise.all([
    getTreatments(accountHolder.business_id),
    getExperts(accountHolder.business_id)
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tratamientos</h1>
        <p className="text-muted-foreground">
          Gestiona los tratamientos y servicios que ofreces
        </p>
      </div>

      <TreatmentsManager 
        businessId={accountHolder.business_id}
        initialTreatments={treatments}
        experts={experts}
      />
    </div>
  )
}
