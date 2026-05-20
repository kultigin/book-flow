import { notFound } from 'next/navigation'
import { sql } from '@/lib/db'
import { PublicBookingForm } from '@/components/public/booking-form'
import { UserCircle } from 'lucide-react'

interface Treatment {
  id: string
  name: string
  duration_minutes: number
  price: number | null
  description: string | null
}

async function getExpertWithTreatments(slug: string) {
  const experts = await sql`
    SELECT ah.id, ah.name, ah.bio, ah.slug, ah.business_id,
           b.name as business_name
    FROM account_holders ah
    JOIN businesses b ON b.id = ah.business_id
    WHERE ah.slug = ${slug} AND ah.is_active = true
  `
  if (experts.length === 0) return null

  const expert = experts[0]

  const treatments = await sql`
    SELECT id, name, duration_minutes, price, description
    FROM treatments
    WHERE expert_id = ${expert.id} AND is_active = true
    ORDER BY name
  ` as Treatment[]

  return { expert, treatments }
}

export default async function ExpertBookingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const data = await getExpertWithTreatments(slug)

  if (!data) notFound()

  const { expert, treatments } = data

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-lg px-4 py-8">
        {/* Expert header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserCircle className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-bold">{expert.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{expert.business_name}</p>
          {expert.bio && (
            <p className="mt-3 text-sm text-muted-foreground max-w-sm leading-relaxed">
              {expert.bio}
            </p>
          )}
        </div>

        <PublicBookingForm
          businessId={expert.business_id}
          businessName={expert.business_name}
          expertId={expert.id}
          expertName={expert.name}
          treatments={treatments}
        />
      </div>
    </div>
  )
}
