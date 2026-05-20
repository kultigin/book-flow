'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Mail,
  Phone,
  User,
} from 'lucide-react'

interface Treatment {
  id: string
  name: string
  duration_minutes: number
  price: number | null
  description: string | null
}

interface PublicBookingFormProps {
  businessId: string
  businessName: string
  expertId: string
  expertName: string
  treatments: Treatment[]
}

type Step = 'treatment' | 'date' | 'time' | 'details' | 'verify' | 'success'

const REMINDER_OPTIONS = [
  { value: 60,   label: '1 hora antes' },
  { value: 120,  label: '2 horas antes' },
  { value: 180,  label: '3 horas antes' },
  { value: 1440, label: '1 dia antes' },
  { value: 2880, label: '2 dias antes' },
]

const STEP_TITLES: Record<Step, string> = {
  treatment: 'Selecciona un tratamiento',
  date:      'Elige una fecha',
  time:      'Elige una hora',
  details:   'Tus datos',
  verify:    'Verifica tu telefono',
  success:   '',
}

const STEP_DESCRIPTIONS: Record<Step, string> = {
  treatment: 'Que servicio deseas reservar?',
  date:      'En que dia te viene bien?',
  time:      '',
  details:   'Con quien confirmo tu cita?',
  verify:    'Te hemos enviado un codigo por SMS',
  success:   '',
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function PublicBookingForm({
  businessId,
  businessName,
  expertId,
  expertName,
  treatments,
}: PublicBookingFormProps) {
  const [step, setStep] = useState<Step>('treatment')
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    reminderMinutes: 180,
  })

  // Fetch slots once treatment + date are selected
  const slotsUrl =
    selectedDate && selectedTreatment
      ? `/api/slots?businessId=${businessId}&date=${selectedDate}&expertId=${expertId}&duration=${selectedTreatment.duration_minutes}`
      : null
  const { data: slotsData, isLoading: slotsLoading } = useSWR(slotsUrl, fetcher)

  // Next 30 days
  const dates = Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return d.toISOString().split('T')[0]
  })

  function formatDateDisplay(dateStr: string) {
    const d = new Date(dateStr)
    return {
      day:   d.toLocaleDateString('es-ES', { weekday: 'short' }),
      num:   d.getDate(),
      month: d.toLocaleDateString('es-ES', { month: 'short' }),
    }
  }

  function formatDateLong(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long',
    })
  }

  function handleBack() {
    setError('')
    if (step === 'date')    setStep('treatment')
    if (step === 'time')    setStep('date')
    if (step === 'details') setStep('time')
    if (step === 'verify')  setStep('details')
  }

  async function handleRequestCode(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/public/request-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, phone: formData.phone }),
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
          expertId,
          treatmentId: selectedTreatment!.id,
          date: selectedDate,
          slotTime: selectedTime,
          clientName: formData.name,
          clientPhone: formData.phone,
          clientEmail: formData.email || null,
          reminderMinutes: formData.reminderMinutes,
          verificationCode,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Codigo invalido')
        return
      }
      setStep('success')
    } catch {
      setError('Error de conexion')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <Card>
        <CardContent className="py-12 text-center px-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-bold mb-2">Reserva confirmada</h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-1">
            <span className="font-medium text-foreground">{selectedTreatment?.name}</span>
            {' '}con {expertName}
          </p>
          <p className="text-muted-foreground text-sm mb-6">
            {formatDateLong(selectedDate)} a las {selectedTime}
          </p>
          <p className="text-xs text-muted-foreground">
            Te enviamos un SMS de confirmacion. Te avisaremos antes de tu cita.
          </p>
        </CardContent>
      </Card>
    )
  }

  // ── Shared card header ────────────────────────────────────────────────────
  const showBack = step !== 'treatment'

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-start gap-3">
          {showBack && (
            <Button variant="ghost" size="icon" onClick={handleBack} className="shrink-0 -ml-2 mt-0.5">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg">{STEP_TITLES[step]}</CardTitle>
            {STEP_DESCRIPTIONS[step] && (
              <CardDescription className="mt-0.5">
                {step === 'time'
                  ? `Horarios para el ${formatDateLong(selectedDate)}`
                  : STEP_DESCRIPTIONS[step]}
              </CardDescription>
            )}
          </div>
        </div>

        {/* Booking summary chips */}
        {(selectedTreatment || selectedDate || selectedTime) && step !== 'treatment' && (
          <div className="flex flex-wrap gap-2 mt-3">
            {selectedTreatment && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {selectedTreatment.name}
              </span>
            )}
            {selectedDate && step !== 'date' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {new Date(selectedDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              </span>
            )}
            {selectedTime && step !== 'time' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {selectedTime}
              </span>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* ── Treatment step ── */}
        {step === 'treatment' && (
          <div className="space-y-3">
            {treatments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay tratamientos disponibles
              </p>
            ) : (
              treatments.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedTreatment(t)
                    setSelectedDate('')
                    setSelectedTime('')
                    setStep('date')
                  }}
                  className="w-full rounded-xl border-2 p-4 text-left transition-all hover:border-primary hover:bg-primary/5 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-base">{t.name}</p>
                      {t.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {t.description}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {t.duration_minutes} min
                    </span>
                    {t.price !== null && (
                      <span className="font-medium text-foreground">
                        €{Number(t.price).toFixed(0)}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* ── Date step ── */}
        {step === 'date' && (
          <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
            {dates.map((date) => {
              const { day, num, month } = formatDateDisplay(date)
              return (
                <button
                  key={date}
                  onClick={() => {
                    setSelectedDate(date)
                    setSelectedTime('')
                    setStep('time')
                  }}
                  className={cn(
                    'flex flex-col items-center p-3 rounded-xl border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    selectedDate === date
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:border-primary/50 hover:bg-muted'
                  )}
                >
                  <span className="text-xs uppercase font-medium">{day}</span>
                  <span className="text-lg font-bold leading-tight">{num}</span>
                  <span className="text-xs">{month}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* ── Time step ── */}
        {step === 'time' && (
          <>
            {slotsLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <Spinner className="h-8 w-8" />
                <p className="text-sm">Buscando horarios...</p>
              </div>
            ) : !slotsData?.slots?.some((s: { available: boolean }) => s.available) ? (
              <div className="text-center py-12 space-y-2">
                <Clock className="h-10 w-10 mx-auto text-muted-foreground/40" />
                <p className="font-medium">Sin horarios disponibles</p>
                <p className="text-sm text-muted-foreground">
                  {slotsData?.message || 'No hay huecos libres para esta fecha'}
                </p>
                <Button variant="outline" className="mt-4" onClick={() => setStep('date')}>
                  Elegir otra fecha
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {slotsData.slots
                  .filter((s: { available: boolean }) => s.available)
                  .map((slot: { time: string }) => (
                    <button
                      key={slot.time}
                      onClick={() => {
                        setSelectedTime(slot.time)
                        setStep('details')
                      }}
                      className={cn(
                        'flex items-center justify-center gap-1.5 p-3 rounded-xl border-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                        selectedTime === slot.time
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border hover:border-primary/50 hover:bg-muted'
                      )}
                    >
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      {slot.time}
                    </button>
                  ))}
              </div>
            )}
          </>
        )}

        {/* ── Details step ── */}
        {step === 'details' && (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="pb-name">Nombre completo</FieldLabel>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="pb-name"
                    value={formData.name}
                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                    placeholder="Tu nombre"
                    className="pl-10"
                    required
                  />
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="pb-phone">Telefono movil</FieldLabel>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="pb-phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+34 612 345 678"
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Te enviaremos un codigo de verificacion por SMS
                </p>
              </Field>

              <Field>
                <FieldLabel htmlFor="pb-email">Email (opcional)</FieldLabel>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="pb-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                    placeholder="tu@email.com"
                    className="pl-10"
                  />
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="pb-reminder">Recordarme</FieldLabel>
                <Select
                  value={String(formData.reminderMinutes)}
                  onValueChange={(v) => setFormData(p => ({ ...p, reminderMinutes: Number(v) }))}
                >
                  <SelectTrigger id="pb-reminder">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REMINDER_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={String(o.value)}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
              {isSubmitting ? 'Enviando codigo...' : 'Continuar'}
            </Button>
          </form>
        )}

        {/* ── Verify step ── */}
        {step === 'verify' && (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="text-center py-2 mb-2">
              <p className="text-sm text-muted-foreground">Codigo enviado a</p>
              <p className="font-semibold">{formData.phone}</p>
            </div>

            <Field>
              <FieldLabel htmlFor="pb-code" className="sr-only">Codigo de verificacion</FieldLabel>
              <Input
                id="pb-code"
                inputMode="numeric"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="text-center text-3xl tracking-[0.5em] font-bold h-14"
                maxLength={6}
                required
                autoFocus
              />
            </Field>

            {error && <p className="text-sm text-destructive text-center">{error}</p>}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitting || verificationCode.length !== 6}
            >
              {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
              {isSubmitting ? 'Confirmando...' : 'Confirmar reserva'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full text-sm"
              onClick={(e) => {
                setVerificationCode('')
                handleRequestCode(e as unknown as React.FormEvent)
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
