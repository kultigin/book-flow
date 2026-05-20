import { requireAdmin } from '@/lib/auth'
import { sql } from '@/lib/db'
import { TeamManager } from '@/components/dashboard/team-manager'

async function getTeamWithTreatments(businessId: string) {
  return sql`
    SELECT
      ah.id, ah.name, ah.email, ah.role, ah.slug, ah.bio, ah.is_active, ah.created_at,
      COALESCE(
        json_agg(
          json_build_object('id', t.id, 'name', t.name, 'duration_minutes', t.duration_minutes)
          ORDER BY t.name
        ) FILTER (WHERE t.id IS NOT NULL),
        '[]'::json
      ) as treatments
    FROM account_holders ah
    LEFT JOIN treatments t ON t.expert_id = ah.id AND t.is_active = true
    WHERE ah.business_id = ${businessId}
    GROUP BY ah.id, ah.name, ah.email, ah.role, ah.slug, ah.bio, ah.is_active, ah.created_at
    ORDER BY ah.role, ah.name
  `
}

export default async function TeamPage() {
  const { accountHolder } = await requireAdmin()
  const members = await getTeamWithTreatments(accountHolder.business_id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Equipo</h1>
        <p className="text-muted-foreground">
          Gestiona los expertos y sus perfiles de reserva
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
