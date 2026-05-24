// Recent bookings component - force recompile v2
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { Calendar, Clock, Stethoscope, User } from 'lucide-react'

interface Booking {
  id: string
  date: string
  start_time: string
  end_time: string
  status: string
  client_name: string
  client_phone: string
  treatment_name?: string
  expert_name?: string
  notes?: string
}

interface RecentBookingsProps {
  bookings: Booking[]
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-ES', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short' 
  })
}

function formatTime(time: string) {
  return time.slice(0, 5)
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'confirmed':
      return <Badge variant="default">Confirmada</Badge>
    case 'pending':
      return <Badge variant="secondary">Pendiente</Badge>
    case 'cancelled':
      return <Badge variant="destructive">Cancelada</Badge>
    case 'completed':
      return <Badge variant="outline">Completada</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export function RecentBookings({ bookings }: RecentBookingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Proximas reservas</CardTitle>
        <CardDescription>Las proximas citas programadas</CardDescription>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Calendar className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>Sin reservas</EmptyTitle>
              <EmptyDescription>No hay reservas proximas programadas</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-start justify-between gap-4 rounded-lg border p-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{booking.client_name}</span>
                  </div>
                  {booking.treatment_name && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Stethoscope className="h-3.5 w-3.5" />
                      <span>{booking.treatment_name}{booking.expert_name ? ` · ${booking.expert_name}` : ''}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(booking.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                    </span>
                  </div>
                </div>
                {getStatusBadge(booking.status)}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
