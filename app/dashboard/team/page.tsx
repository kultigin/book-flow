import { requireAdmin } from '@/lib/auth'
import { sql } from '@/lib/db'
import { TeamManager } from '@/components/dashboard/team-manager'

async function getTeamMembers(businessId: string) {
  const members = await sql`
    SELECT * FROM account_holders 
    WHERE business_id = ${businessId}
    ORDER BY role, name
  `
  return members
}

export default async function TeamPage() {
  const { accountHolder } = await requireAdmin()
  const members = await getTeamMembers(accountHolder.business_id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Equipo</h1>
        <p className="text-muted-foreground">
          Gestiona los miembros de tu equipo
        </p>
      </div>

      <TeamManager 
        businessId={accountHolder.business_id}
        initialMembers={members}
        currentUserId={accountHolder.id}
      />
    </div>
  )
}
