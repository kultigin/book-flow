'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function CancelBookingForm({ bookingId }: { bookingId: string }) {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cancelled, setCancelled] = useState(false)

  async function handleCancel() {
    if (!phone.trim()) {
      setError('Introduce tu número de teléfono')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/public/cancel-booking/${bookingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Error al cancelar la reserva')
        return
      }
      setCancelled(true)
    } finally {
      setLoading(false)
    }
  }

  if (cancelled) {
    return (
      <div className="text-center space-y-2">
        <p className="text-sm font-medium text-green-600">Reserva cancelada correctamente.</p>
        <p className="text-xs text-muted-foreground">Recibirás una confirmación por SMS.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="phone">Tu número de teléfono</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="637 055 610"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">Introduce el mismo número con el que hiciste la reserva.</p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button variant="destructive" className="w-full" onClick={handleCancel} disabled={loading}>
        {loading ? 'Cancelando...' : 'Cancelar reserva'}
      </Button>
    </div>
  )
}
