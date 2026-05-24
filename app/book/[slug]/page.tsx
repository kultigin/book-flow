export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { sql } from '@/lib/db'
import { PublicBookingForm } from '@/components/public/booking-form'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

async function getExpertData(slug: string) {
  const experts = await sql`
    SELECT ah.id, ah.name, ah.bio, ah.slug, ah.business_id, ah.avatar_url,
           b.name as business_name
    FROM account_holders ah
    JOIN businesses b ON b.id = ah.business_id
    WHERE ah.slug = ${slug} AND ah.is_active = true
  `
  if (experts.length === 0) return null

  const expert = experts[0]

  const [individualTreatments, groupTreatments] = await Promise.all([
    sql`
      SELECT id, name, duration_minutes, price, description
      FROM treatments
      WHERE expert_id = ${expert.id} AND is_active = true
        AND (is_group = false OR is_group IS NULL)
      ORDER BY name
    `,
    sql`
      SELECT t.id, t.name, t.duration_minutes, t.price, t.description, t.max_capacity,
        COALESCE(
          json_agg(
            json_build_object('day_of_week', ts.day_of_week, 'start_time', ts.start_time::text)
            ORDER BY ts.day_of_week, ts.start_time
          ) FILTER (WHERE ts.id IS NOT NULL),
          '[]'::json
        ) as schedules
      FROM treatments t
      LEFT JOIN treatment_schedules ts ON ts.treatment_id = t.id
      WHERE t.expert_id = ${expert.id} AND t.is_active = true AND t.is_group = true
      GROUP BY t.id, t.name, t.duration_minutes, t.price, t.description, t.max_capacity
      ORDER BY t.name
    `,
  ])

  return { expert, individualTreatments, groupTreatments }
}

export default async function ExpertBookingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const data = await getExpertData(slug)

  if (!data) notFound()

  const { expert, individualTreatments, groupTreatments } = data

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4">
            <Avatar className="h-20 w-20">
              {expert.avatar_url && <AvatarImage src={`/api/public/avatar/${expert.id}`} alt={expert.name} />}
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {expert.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <h1 className="text-2xl font-bold">{expert.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{expert.business_name}</p>
          {expert.bio && (
            <p className="mt-3 text-sm text-muted-foreground max-w-sm leading-relaxed">{expert.bio}</p>
          )}
        </div>

        <PublicBookingForm
          businessId={expert.business_id}
          businessName={expert.business_name}
          expertId={expert.id}
          expertName={expert.name}
          treatments={individualTreatments as any}
          groupTreatments={groupTreatments as any}
        />
      </div>
    </div>
  )
}
