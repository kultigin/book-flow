import { notFound } from 'next/navigation'
import { getBusinessBySlug } from '@/lib/auth'
import { sql } from '@/lib/db'
import { PublicBookingForm } from '@/components/public/booking-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Clock, MapPin } from 'lucide-react'

async function getBusinessWithAvailability(slug: string) {
  const business = await getBusinessBySlug(slug)
  if (!business) return null

  const availability = await sql`
    SELECT * FROM availability 
    WHERE business_id = ${business.id} AND is_available = true
    ORDER BY day_of_week
  `

  return { business, availability }
}

export default async function PublicBookingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const data = await getBusinessWithAvailability(slug)

  if (!data) {
    notFound()
  }

  const { business, availability } = data

  const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Card className="mb-6">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">{business.name}</CardTitle>
            <CardDescription>Reserva tu cita online</CardDescription>
          </CardHeader>
          <CardContent>
            {business.description && (
              <p className="text-center text-muted-foreground mb-4">
                {business.description}
              </p>
            )}
            
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>
                  {availability[0]?.slot_duration_minutes || 30} min por cita
                </span>
              </div>
              {business.address && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{business.address}</span>
                </div>
              )}
            </div>

            <div className="mt-6 border-t pt-6">
              <h3 className="text-sm font-medium mb-3">Horarios de atencion:</h3>
              <div className="grid gap-2 text-sm">
                {availability.map((avail) => (
                  <div key={avail.day_of_week} className="flex justify-between">
                    <span className="text-muted-foreground">{DAYS[avail.day_of_week]}</span>
                    <span>
                      {avail.start_time.slice(0, 5)} - {avail.end_time.slice(0, 5)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <PublicBookingForm 
          businessId={business.id} 
          businessName={business.name}
          businessSlug={business.slug}
        />
      </div>
    </div>
  )
}
