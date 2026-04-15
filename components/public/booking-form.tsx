'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { Empty } from '@/components/ui/empty'
import { cn } from '@/lib/utils'
import { Calendar, Check, Clock, Phone, User, ArrowLeft } from 'lucide-react'

interface PublicBookingFormProps {
  businessId: string
  businessName: string
  businessSlug: string
}

type Step = 'date' | 'time' | 'details' | 'verify' | 'success'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function PublicBookingForm({ businessId, businessName, businessSlug }: PublicBookingFormProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('date')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [bookingId, setBookingId] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: ''
  })

  const { data: slotsData, isLoading: slotsLoading } = useSWR(
    selectedDate ? `/api/slots?businessId=${businessId}&date=${selectedDate}` : null,
    fetcher
  )

  // Generate next 30 days
  const dates = Array.from({ length: 30 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() + i)
    return date.toISOString().split('T')[0]
  })

  function formatDateDisplay(dateStr: string) {
    const date = new Date(dateStr)
    return {
      day: date.toLocaleDateString('es-ES', { weekday: 'short' }),
      date: date.getDate(),
      month: date.toLocaleDateString('es-ES', { month: 'short' })
    }
  }

  async function handleSubmitDetails(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      // First, request verification code
      const res = await fetch('/api/public/request-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          phone: formData.phone
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al enviar el codigo')
        return
      }

      setStep('verify')
    } catch {
      setError('Error de conexion')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/public/verify-and-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          date: selectedDate,
          slotTime: selectedTime,
          clientName: formData.name,
          clientPhone: formData.phone,
          clientEmail: formData.email || null,
          notes: formData.notes || null,
          verificationCode
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Codigo invalido')
        return
      }

      setBookingId(data.booking.id)
      setStep('success')
    } catch {
      setError('Error de conexion')
    } finally {
      setIsSubmitting(false)
    }
  }

  function formatSelectedDate() {
    if (!selectedDate) return ''
    return new Date(selectedDate).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })
  }

  if (step === 'success') {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <Check className="h-8 w-8 text-success" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Reserva confirmada</h2>
          <p className="text-muted-foreground mb-6">
            Tu cita en {businessName} ha sido confirmada para el {formatSelectedDate()} a las {selectedTime}.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Te hemos enviado un SMS con los detalles. Te recordaremos 24 horas y 2 horas antes de tu cita.
          </p>
          <Button onClick={() => router.push(`/my-bookings?phone=${encodeURIComponent(formData.phone)}`)}>
            Ver mis reservas
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {step !== 'date' && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => {
                if (step === 'time') setStep('date')
                else if (step === 'details') setStep('time')
                else if (step === 'verify') setStep('details')
              }}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <CardTitle>
              {step === 'date' && 'Selecciona una fecha'}
              {step === 'time' && 'Selecciona una hora'}
              {step === 'details' && 'Tus datos'}
              {step === 'verify' && 'Verifica tu telefono'}
            </CardTitle>
            <CardDescription>
              {step === 'date' && 'Elige el dia para tu cita'}
              {step === 'time' && `Horarios disponibles para ${formatSelectedDate()}`}
              {step === 'details' && 'Completa tus datos para confirmar'}
              {step === 'verify' && 'Ingresa el codigo que recibiste por SMS'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {step === 'date' && (
          <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
            {dates.map((date) => {
              const { day, date: dayNum, month } = formatDateDisplay(date)
              const isSelected = selectedDate === date
              
              return (
                <button
                  key={date}
                  onClick={() => {
                    setSelectedDate(date)
                    setSelectedTime('')
                    setStep('time')
                  }}
                  className={cn(
                    'flex flex-col items-center p-3 rounded-lg border transition-colors',
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'hover:border-primary/50 hover:bg-muted'
                  )}
                >
                  <span className="text-xs uppercase">{day}</span>
                  <span className="text-lg font-bold">{dayNum}</span>
                  <span className="text-xs">{month}</span>
                </button>
              )
            })}
          </div>
        )}

        {step === 'time' && (
          <>
            {slotsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner className="h-8 w-8" />
              </div>
            ) : slotsData?.slots?.length === 0 ? (
              <Empty
                icon={Clock}
                title="Sin horarios disponibles"
                description={slotsData?.message || 'No hay horarios disponibles para esta fecha'}
              />
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {slotsData?.slots?.filter((s: { available: boolean }) => s.available).map((slot: { time: string }) => (
                  <button
                    key={slot.time}
                    onClick={() => {
                      setSelectedTime(slot.time)
                      setStep('details')
                    }}
                    className={cn(
                      'flex items-center justify-center p-3 rounded-lg border transition-colors',
                      selectedTime === slot.time
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'hover:border-primary/50 hover:bg-muted'
                    )}
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    {slot.time}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {step === 'details' && (
          <form onSubmit={handleSubmitDetails} className="space-y-4">
            <div className="rounded-lg bg-muted p-4 mb-4">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {formatSelectedDate()}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {selectedTime}
                </div>
              </div>
            </div>

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Nombre completo</FieldLabel>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Tu nombre"
                    className="pl-10"
                    required
                  />
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="phone">Telefono movil</FieldLabel>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+34 612 345 678"
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Recibiras un codigo de verificacion por SMS
                </p>
              </Field>

              <Field>
                <FieldLabel htmlFor="email">Email (opcional)</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="tu@email.com"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="notes">Notas (opcional)</FieldLabel>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Informacion adicional para tu cita..."
                  rows={3}
                />
              </Field>
            </FieldGroup>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Spinner className="mr-2 h-4 w-4" /> : null}
              {isSubmitting ? 'Enviando codigo...' : 'Continuar'}
            </Button>
          </form>
        )}

        {step === 'verify' && (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="text-center mb-6">
              <p className="text-muted-foreground">
                Hemos enviado un codigo de 6 digitos al numero
              </p>
              <p className="font-medium">{formData.phone}</p>
            </div>

            <Field>
              <FieldLabel htmlFor="code">Codigo de verificacion</FieldLabel>
              <Input
                id="code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="text-center text-2xl tracking-widest"
                maxLength={6}
                required
              />
            </Field>

            {error && <p className="text-sm text-destructive text-center">{error}</p>}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting || verificationCode.length !== 6}
            >
              {isSubmitting ? <Spinner className="mr-2 h-4 w-4" /> : null}
              {isSubmitting ? 'Verificando...' : 'Confirmar reserva'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setVerificationCode('')
                handleSubmitDetails(new Event('submit') as unknown as React.FormEvent)
              }}
              disabled={isSubmitting}
            >
              Reenviar codigo
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
