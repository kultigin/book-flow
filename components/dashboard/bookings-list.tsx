'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Empty } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Calendar, Clock, MoreVertical, Phone, Search, User, XCircle, CheckCircle } from 'lucide-react'

interface Booking {
  id: string
  date: string
  start_time: string
  end_time: string
  status: string
  notes?: string
  client_name: string
  client_phone: string
  client_email?: string
  created_by_name?: string
}

interface BookingsListProps {
  bookings: Booking[]
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-ES', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short',
    year: 'numeric'
  })
}

function formatTime(time: string) {
  return time.slice(0, 5)
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'confirmed':
      return <Badge className="bg-success text-success-foreground">Confirmada</Badge>
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

export function BookingsList({ bookings }: BookingsListProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const filteredBookings = bookings.filter((booking) => 
    booking.client_name.toLowerCase().includes(search.toLowerCase()) ||
    booking.client_phone.includes(search)
  )

  async function updateBookingStatus(bookingId: string, status: string) {
    setIsUpdating(true)
    try {
      await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      router.refresh()
    } catch (error) {
      console.error('Update error:', error)
    } finally {
      setIsUpdating(false)
      setCancelDialogOpen(false)
      setSelectedBooking(null)
    }
  }

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o telefono..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {filteredBookings.length === 0 ? (
            <Empty 
              icon={Calendar}
              title="Sin reservas"
              description={search ? 'No se encontraron reservas con ese criterio' : 'No hay reservas registradas'}
            />
          ) : (
            <div className="space-y-3">
              {filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-start justify-between gap-4 rounded-lg border p-4"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{booking.client_name}</span>
                      {getStatusBadge(booking.status)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(booking.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" />
                        {booking.client_phone}
                      </span>
                    </div>
                    
                    {booking.notes && (
                      <p className="text-sm text-muted-foreground">
                        Notas: {booking.notes}
                      </p>
                    )}
                    
                    {booking.created_by_name && (
                      <p className="text-xs text-muted-foreground">
                        Creada por: {booking.created_by_name}
                      </p>
                    )}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {booking.status === 'pending' && (
                        <DropdownMenuItem onClick={() => updateBookingStatus(booking.id, 'confirmed')}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Confirmar
                        </DropdownMenuItem>
                      )}
                      {booking.status === 'confirmed' && (
                        <DropdownMenuItem onClick={() => updateBookingStatus(booking.id, 'completed')}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Marcar completada
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      {(booking.status === 'pending' || booking.status === 'confirmed') && (
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedBooking(booking)
                            setCancelDialogOpen(true)
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Cancelar reserva
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar reserva</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion cancelara la reserva de {selectedBooking?.client_name} y le enviara una notificacion por SMS.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedBooking && updateBookingStatus(selectedBooking.id, 'cancelled')}
              disabled={isUpdating}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isUpdating ? 'Cancelando...' : 'Si, cancelar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
