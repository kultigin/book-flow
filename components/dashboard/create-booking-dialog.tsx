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

interface CreateBookingDialogProps {
  businessId: string
  accountHolderId: string
  children: React.ReactNode
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function CreateBookingDialog({ businessId, accountHolderId, children }: CreateBookingDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  
  const [selectedDate, setSelectedDate] = useState('')
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    notes: '',
    slotTime: ''
  })

  const { data: slotsData, isLoading: slotsLoading } = useSWR(
    selectedDate ? `/api/slots?businessId=${businessId}&date=${selectedDate}` : null,
    fetcher
  )

  const today = new Date().toISOString().split('T')[0]

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
          skipVerification: true // Staff doesn't need verification
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al crear la reserva')
        return
      }

      setOpen(false)
      setFormData({ clientName: '', clientPhone: '', clientEmail: '', notes: '', slotTime: '' })
      setSelectedDate('')
      router.refresh()
    } catch {
      setError('Error de conexion')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva reserva</DialogTitle>
          <DialogDescription>
            Crea una reserva para un cliente. Se le enviara una notificacion por SMS.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="clientName">Nombre del cliente</FieldLabel>
              <Input
                id="clientName"
                value={formData.clientName}
                onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                placeholder="Nombre completo"
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="clientPhone">Telefono</FieldLabel>
              <Input
                id="clientPhone"
                type="tel"
                value={formData.clientPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))}
                placeholder="+34 612 345 678"
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="clientEmail">Email (opcional)</FieldLabel>
              <Input
                id="clientEmail"
                type="email"
                value={formData.clientEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                placeholder="cliente@email.com"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="date">Fecha</FieldLabel>
              <Input
                id="date"
                type="date"
                min={today}
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value)
                  setFormData(prev => ({ ...prev, slotTime: '' }))
                }}
                required
              />
            </Field>

            {selectedDate && (
              <Field>
                <FieldLabel htmlFor="slotTime">Hora</FieldLabel>
                {slotsLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Spinner className="h-4 w-4" />
                    Cargando horarios...
                  </div>
                ) : slotsData?.slots?.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay horarios disponibles para esta fecha</p>
                ) : (
                  <Select
                    value={formData.slotTime}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, slotTime: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una hora" />
                    </SelectTrigger>
                    <SelectContent>
                      {slotsData?.slots?.map((slot: { time: string; available: boolean }) => (
                        <SelectItem 
                          key={slot.time} 
                          value={slot.time}
                          disabled={!slot.available}
                        >
                          {slot.time} {!slot.available && '(Ocupado)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </Field>
            )}

            <Field>
              <FieldLabel htmlFor="notes">Notas (opcional)</FieldLabel>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Notas adicionales sobre la reserva..."
                rows={3}
              />
            </Field>
          </FieldGroup>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.slotTime}
            >
              {isSubmitting ? <Spinner className="mr-2 h-4 w-4" /> : null}
              {isSubmitting ? 'Creando...' : 'Crear reserva'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
