'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  experts: Expert[]
  treatments: Treatment[]
  children: React.ReactNode
}

const REMINDER_OPTIONS = [
  { value: 60, label: '1 hora antes' },
  { value: 120, label: '2 horas antes' },
  { value: 180, label: '3 horas antes' },
  { value: 1440, label: '1 dia antes' },
  { value: 2880, label: '2 dias antes' },
]

const fetcher = (url: string) => fetch(url).then(res => res.json())

const emptyForm = {
  clientName: '',
  clientPhone: '',
  clientEmail: '',
  notes: '',
  expertId: '',
  treatmentId: '',
  slotTime: '',
  reminderMinutes: 180,
}

export function CreateBookingDialog({
  businessId,
  accountHolderId,
  experts,
  treatments,
  children,
}: CreateBookingDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [formData, setFormData] = useState(emptyForm)

  const selectedTreatment = treatments.find(t => t.id === formData.treatmentId)
  const expertTreatments = treatments.filter(t => t.expert_id === formData.expertId)

  const slotsUrl =
    selectedDate && formData.expertId && formData.treatmentId
      ? `/api/slots?businessId=${businessId}&date=${selectedDate}&expertId=${formData.expertId}&duration=${selectedTreatment?.duration_minutes ?? 30}`
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
    setFormData(emptyForm)
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
          expertId: formData.expertId || null,
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

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true) }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva reserva</DialogTitle>
          <DialogDescription>
            Crea una reserva para un cliente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="cb-name">Nombre del cliente</FieldLabel>
              <Input
                id="cb-name"
                value={formData.clientName}
                onChange={(e) => setFormData(p => ({ ...p, clientName: e.target.value }))}
                placeholder="Nombre completo"
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="cb-phone">Telefono</FieldLabel>
              <Input
                id="cb-phone"
                type="tel"
                value={formData.clientPhone}
                onChange={(e) => setFormData(p => ({ ...p, clientPhone: e.target.value }))}
                placeholder="+34 612 345 678"
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="cb-email">Email (opcional)</FieldLabel>
              <Input
                id="cb-email"
                type="email"
                value={formData.clientEmail}
                onChange={(e) => setFormData(p => ({ ...p, clientEmail: e.target.value }))}
                placeholder="cliente@email.com"
              />
            </Field>

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

            {formData.expertId && (
              <Field>
                <FieldLabel htmlFor="cb-treatment">Tratamiento</FieldLabel>
                {expertTreatments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Este experto no tiene tratamientos activos</p>
                ) : (
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
                )}
              </Field>
            )}

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

            {selectedDate && formData.treatmentId && (
              <Field>
                <FieldLabel htmlFor="cb-time">Hora</FieldLabel>
                {slotsLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Spinner className="h-4 w-4" />
                    Cargando horarios...
                  </div>
                ) : slotsData?.slots?.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {slotsData?.message || 'No hay horarios disponibles para esta fecha'}
                  </p>
                ) : (
                  <Select
                    value={formData.slotTime}
                    onValueChange={(v) => setFormData(p => ({ ...p, slotTime: v }))}
                  >
                    <SelectTrigger id="cb-time">
                      <SelectValue placeholder="Selecciona una hora" />
                    </SelectTrigger>
                    <SelectContent>
                      {slotsData?.slots?.map((slot: { time: string; available: boolean }) => (
                        <SelectItem key={slot.time} value={slot.time} disabled={!slot.available}>
                          {slot.time}{!slot.available ? ' (Ocupado)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </Field>
            )}

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
                  {REMINDER_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                  ))}
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
                rows={3}
              />
            </Field>
          </FieldGroup>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.slotTime}
            >
              {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
              {isSubmitting ? 'Creando...' : 'Crear reserva'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
