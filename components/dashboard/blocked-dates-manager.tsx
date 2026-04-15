'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { Empty } from '@/components/ui/empty'
import { CalendarOff, Plus, Trash2 } from 'lucide-react'

interface BlockedDate {
  id: string
  business_id: string
  date: string
  reason?: string
}

interface BlockedDatesManagerProps {
  businessId: string
  initialBlockedDates: BlockedDate[]
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-ES', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long',
    year: 'numeric'
  })
}

export function BlockedDatesManager({ businessId, initialBlockedDates }: BlockedDatesManagerProps) {
  const router = useRouter()
  const [blockedDates, setBlockedDates] = useState(initialBlockedDates)
  const [newDate, setNewDate] = useState('')
  const [newReason, setNewReason] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleAddDate() {
    if (!newDate) return
    
    setIsAdding(true)
    try {
      const res = await fetch('/api/blocked-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          businessId, 
          date: newDate, 
          reason: newReason || null 
        }),
      })

      if (!res.ok) throw new Error('Failed to add')

      const data = await res.json()
      setBlockedDates((prev) => [...prev, data.blockedDate].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      ))
      setNewDate('')
      setNewReason('')
      router.refresh()
    } catch (error) {
      console.error('Add error:', error)
    } finally {
      setIsAdding(false)
    }
  }

  async function handleRemoveDate(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/blocked-dates/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete')

      setBlockedDates((prev) => prev.filter((d) => d.id !== id))
      router.refresh()
    } catch (error) {
      console.error('Delete error:', error)
    } finally {
      setDeletingId(null)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarOff className="h-5 w-5" />
          Dias bloqueados
        </CardTitle>
        <CardDescription>
          Bloquea fechas especificas en las que no aceptaras reservas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FieldGroup>
          <div className="flex gap-2">
            <Field className="flex-1">
              <FieldLabel className="sr-only">Fecha</FieldLabel>
              <Input
                type="date"
                min={today}
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </Field>
            <Field className="flex-1">
              <FieldLabel className="sr-only">Motivo</FieldLabel>
              <Input
                placeholder="Motivo (opcional)"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
              />
            </Field>
            <Button onClick={handleAddDate} disabled={!newDate || isAdding}>
              {isAdding ? <Spinner className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
        </FieldGroup>

        {blockedDates.length === 0 ? (
          <Empty
            icon={CalendarOff}
            title="Sin dias bloqueados"
            description="No hay fechas bloqueadas configuradas"
          />
        ) : (
          <div className="space-y-2">
            {blockedDates.map((blocked) => (
              <div
                key={blocked.id}
                className="flex items-center justify-between gap-4 rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium">{formatDate(blocked.date)}</p>
                  {blocked.reason && (
                    <p className="text-sm text-muted-foreground">{blocked.reason}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveDate(blocked.id)}
                  disabled={deletingId === blocked.id}
                >
                  {deletingId === blocked.id ? (
                    <Spinner className="h-4 w-4" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-destructive" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
