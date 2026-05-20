'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

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
}

interface CalendarViewProps {
  businessId: string
  initialBookings: Booking[]
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

const DAYS = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export function CalendarView({ businessId, initialBookings }: CalendarViewProps) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const { data } = useSWR(
    `/api/calendar?businessId=${businessId}&year=${year}&month=${month}`,
    fetcher,
    { fallbackData: { bookings: initialBookings } }
  )

  const bookings = data?.bookings || []

  // Generate calendar days
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const daysInMonth = lastDay.getDate()
  const startDayOfWeek = firstDay.getDay()

  const days: (number | null)[] = []
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  // Group bookings by date
  const bookingsByDate: Record<string, Booking[]> = {}
  bookings.forEach((booking: Booking) => {
    const date = booking.date.split('T')[0]
    if (!bookingsByDate[date]) {
      bookingsByDate[date] = []
    }
    bookingsByDate[date].push(booking)
  })

  function getDateString(day: number) {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  function prevMonth() {
    if (month === 1) {
      setYear(year - 1)
      setMonth(12)
    } else {
      setMonth(month - 1)
    }
    setSelectedDate(null)
  }

  function nextMonth() {
    if (month === 12) {
      setYear(year + 1)
      setMonth(1)
    } else {
      setMonth(month + 1)
    }
    setSelectedDate(null)
  }

  const today = now.toISOString().split('T')[0]
  const selectedDateBookings = selectedDate ? (bookingsByDate[selectedDate] || []) : []

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>{MONTHS[month - 1]} {year}</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {DAYS.map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
            {days.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="p-2" />
              }

              const dateStr = getDateString(day)
              const dayBookings = bookingsByDate[dateStr] || []
              const isToday = dateStr === today
              const isSelected = dateStr === selectedDate

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dateStr)}
                  className={cn(
                    'p-2 text-sm rounded-lg transition-colors min-h-[60px] flex flex-col items-center',
                    isToday && 'bg-primary/10',
                    isSelected && 'ring-2 ring-primary',
                    dayBookings.length > 0 && 'bg-accent',
                    'hover:bg-muted'
                  )}
                >
                  <span className={cn(
                    'font-medium',
                    isToday && 'text-primary'
                  )}>
                    {day}
                  </span>
                  {dayBookings.length > 0 && (
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {dayBookings.length}
                    </Badge>
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {selectedDate 
              ? new Date(selectedDate).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                })
              : 'Selecciona un dia'
            }
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedDate ? (
            <p className="text-sm text-muted-foreground">
              Haz clic en un dia para ver las reservas
            </p>
          ) : selectedDateBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay reservas para este dia
            </p>
          ) : (
            <div className="space-y-3">
              {selectedDateBookings.map((booking) => (
                <div key={booking.id} className="rounded-lg border p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{booking.client_name}</span>
                    <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                      {booking.start_time.slice(0, 5)}
                    </Badge>
                  </div>
                  {(booking.treatment_name || booking.expert_name) && (
                    <p className="text-sm text-muted-foreground">
                      {booking.treatment_name}
                      {booking.treatment_name && booking.expert_name && ' · '}
                      {booking.expert_name}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">{booking.client_phone}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
