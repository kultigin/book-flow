// Today's schedule component - force recompile v2
import { sql } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { Clock, Phone, User } from 'lucide-react'

interface TodayScheduleProps {
  businessId: string
}

async function getTodayBookings(businessId: string) {
  const today = new Date().toISOString().split('T')[0]
  
  const bookings = await sql`
    SELECT b.*, c.name as client_name, c.phone as client_phone
    FROM bookings b
    JOIN clients c ON b.client_id = c.id
    WHERE b.business_id = ${businessId}
      AND b.date = ${today}
      AND b.status IN ('confirmed', 'pending')
    ORDER BY b.start_time
  `
  
  return bookings
}

function formatTime(time: string) {
  return time.slice(0, 5)
}

function isCurrentOrPast(time: string) {
  const now = new Date()
  const [hours, minutes] = time.split(':').map(Number)
  const bookingTime = new Date()
  bookingTime.setHours(hours, minutes, 0, 0)
  return now >= bookingTime
}

export async function TodaySchedule({ businessId }: TodayScheduleProps) {
  const bookings = await getTodayBookings(businessId)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agenda de hoy</CardTitle>
        <CardDescription>
          {new Date().toLocaleDateString('es-ES', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long' 
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Clock className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>Sin citas hoy</EmptyTitle>
              <EmptyDescription>No hay citas programadas para hoy</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => {
              const isPast = isCurrentOrPast(booking.end_time)
              
              return (
                <div
                  key={booking.id}
                  className={`flex items-center gap-4 rounded-lg border p-3 ${
                    isPast ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex flex-col items-center justify-center w-16 text-center">
                    <span className="text-lg font-semibold">
                      {formatTime(booking.start_time)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(booking.end_time)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="font-medium truncate">{booking.client_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{booking.client_phone}</span>
                    </div>
                  </div>
                  {isPast ? (
                    <Badge variant="outline">Pasada</Badge>
                  ) : (
                    <Badge variant="default">Pendiente</Badge>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
