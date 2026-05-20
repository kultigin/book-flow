'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Expert {
  id: string
  name: string
  slug: string | null
}

interface Treatment {
  id: string
  expert_id: string
  name: string
  duration_minutes: number
}

interface CreateBookingDialogProps {
  businessId: string
  accountHolderId: string
  isAdmin: boolean
  experts: Expert[]
  treatments: Treatment[]
  children: React.ReactNode
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

const emptyForm = {
  clientName: '',
  clientPhone: '',
  clientEmail: '',
  notes: '',
  expertId: '',
  treatmentId: '',
  slotTime: '',
  reminderMinutes: 1440,
}

export function CreateBookingDialog({
  businessId,
  accountHolderId,
  isAdmin,
  experts,
  treatments,
  children,
}: CreateBookingDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [formData, setFormData] = useState({
    ...emptyForm,
    expertId: isAdmin ? '' : accountHolderId,
  })

  const effectiveExpertId = isAdmin ? formData.expertId : accountHolderId
  const expertTreatments = treatments.filter(t => t.expert_id === effectiveExpertId)
  const selectedTreatment = treatments.find(t => t.id === formData.treatmentId)

  const slotsUrl =
    selectedDate && effectiveExpertId && formData.treatmentId
      ? `/api/slots?businessId=${businessId}&date=${selectedDate}&expertId=${effectiveExpertId}&duration=${selectedTreatment?.duration_minutes ?? 30}`
      : null

  const { data: slotsData, isLoading: slotsLoading } = useSWR(slotsUrl, fetcher)

  const today = new Date().toISOString().split('T')[0]

  function handleExpertChange(expertId: string) {
    setFormData(prev => ({ ...prev, expertId, treatmentId: '', slotTime: '' }))
    setSelectedDate('')
  }

  function handleTreatmentChange(treatmentId: string) {
    setFormData(prev => ({ ...prev, treatmentId, slotTime: '' }))
    setSelectedDate('')
  }

  function handleDateChange(date: string) {
    setSelectedDate(date)
    setFormData(prev => ({ ...prev, slotTime: '' }))
  }

  function handleClose() {
    setOpen(false)
    setFormData({ ...emptyForm, expertId: isAdmin ? '' : accountHolderId })
    setSelectedDate('')
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          createdBy: accountHolderId,
          date: selectedDate,
          slotTime: formData.slotTime,
          clientName: formData.clientName,
          clientPhone: formData.clientPhone,
          clientEmail: formData.clientEmail || null,
          notes: formData.notes || null,
          treatmentId: formData.treatmentId || null,
          expertId: effectiveExpertId || null,
          reminderMinutes: formData.reminderMinutes,
          skipVerification: true,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Error al crear la reserva')
        return
      }

      handleClose()
      router.refresh()
    } catch {
      setError('Error de conexion')
    } finally {
      setIsSubmitting(false)
    }
  }

  const availableSlots = slotsData?.slots?.filter((s: { time: string; available: boolean }) => s.available) ?? []

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true) }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-full max-w-sm max-h-[92vh] overflow-y-auto p-4">
        <DialogHeader className="pb-2">
          <DialogTitle>Nueva reserva</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <FieldGroup>
            {/* Client info */}
            <Field>
              <FieldLabel htmlFor="cb-name">Nombre</FieldLabel>
              <Input
                id="cb-name"
                value={formData.clientName}
                onChange={(e) => setFormData(p => ({ ...p, clientName: e.target.value }))}
                placeholder="Nombre del cliente"
                required
                autoComplete="off"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="cb-phone">Teléfono</FieldLabel>
              <Input
                id="cb-phone"
                type="tel"
                inputMode="tel"
                value={formData.clientPhone}
                onChange={(e) => setFormData(p => ({ ...p, clientPhone: e.target.value }))}
                placeholder="+34 612 345 678"
                required
              />
            </Field>

            {/* Admin-only: expert selector */}
            {isAdmin && (
              <Field>
                <FieldLabel htmlFor="cb-expert">Experto</FieldLabel>
                <Select value={formData.expertId} onValueChange={handleExpertChange} required>
                  <SelectTrigger id="cb-expert">
                    <SelectValue placeholder="Seleccionar experto" />
                  </SelectTrigger>
                  <SelectContent>
                    {experts.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}

            {/* Treatment — or warning if none exist (for admin: only after expert is selected) */}
            {effectiveExpertId && (
              expertTreatments.length === 0 ? (
                <p className="text-sm text-amber-600 dark:text-amber-400 rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-3 py-2">
                  No tienes tratamientos activos. Añade uno en <strong>Tratamientos</strong> antes de crear una reserva.
                </p>
              ) : (
                <Field>
                  <FieldLabel htmlFor="cb-treatment">Tratamiento</FieldLabel>
                  <Select value={formData.treatmentId} onValueChange={handleTreatmentChange} required>
                    <SelectTrigger id="cb-treatment">
                      <SelectValue placeholder="Seleccionar tratamiento" />
                    </SelectTrigger>
                    <SelectContent>
                      {expertTreatments.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name} · {t.duration_minutes} min
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )
            )}

            {/* Date — only after treatment is selected */}
            {formData.treatmentId && (
              <Field>
                <FieldLabel htmlFor="cb-date">Fecha</FieldLabel>
                <Input
                  id="cb-date"
                  type="date"
                  min={today}
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  required
                />
              </Field>
            )}

            {/* Time slots as tappable buttons */}
            {selectedDate && (
              <Field>
                <FieldLabel>Hora</FieldLabel>
                {slotsLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                    <Spinner className="h-4 w-4" />
                    Cargando horarios...
                  </div>
                ) : availableSlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-1">
                    {slotsData?.message || 'No hay horarios disponibles'}
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-1.5">
                    {availableSlots.map((slot: { time: string }) => (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, slotTime: slot.time }))}
                        className={`rounded-md border py-2 text-sm font-medium transition-colors ${
                          formData.slotTime === slot.time
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-input bg-background hover:bg-accent hover:text-accent-foreground'
                        }`}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                )}
              </Field>
            )}

            {/* Optional fields — only show once a slot is picked */}
            {formData.slotTime && (
              <>
                <Field>
                  <FieldLabel htmlFor="cb-reminder">Recordatorio</FieldLabel>
                  <Select
                    value={String(formData.reminderMinutes)}
                    onValueChange={(v) => setFormData(p => ({ ...p, reminderMinutes: Number(v) }))}
                  >
                    <SelectTrigger id="cb-reminder">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="60">1 hora antes</SelectItem>
                      <SelectItem value="120">2 horas antes</SelectItem>
                      <SelectItem value="180">3 horas antes</SelectItem>
                      <SelectItem value="1440">1 día antes</SelectItem>
                      <SelectItem value="2880">2 días antes</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel htmlFor="cb-notes">Notas (opcional)</FieldLabel>
                  <Textarea
                    id="cb-notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                    placeholder="Notas adicionales..."
                    rows={2}
                  />
                </Field>
              </>
            )}
          </FieldGroup>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting || !formData.slotTime}>
              {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
              {isSubmitting ? 'Creando...' : 'Crear reserva'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
