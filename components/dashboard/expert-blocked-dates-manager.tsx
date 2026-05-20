'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
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
import { CalendarOff, Plus, Trash2 } from 'lucide-react'

interface ExpertBlockedDate {
  id: string
  expert_id: string
  date: string
  reason?: string
}

interface ExpertBlockedDatesManagerProps {
  initialBlockedDates: ExpertBlockedDate[]
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function ExpertBlockedDatesManager({ initialBlockedDates }: ExpertBlockedDatesManagerProps) {
  const router = useRouter()
  const [blockedDates, setBlockedDates] = useState(initialBlockedDates)
  const [newDate, setNewDate] = useState('')
  const [newReason, setNewReason] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<ExpertBlockedDate | null>(null)

  async function handleAddDate() {
    if (!newDate) return

    setIsAdding(true)
    try {
      const res = await fetch('/api/expert-blocked-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: newDate, reason: newReason || null }),
      })

      if (!res.ok) throw new Error('Failed to add')

      const data = await res.json()
      setBlockedDates((prev) =>
        [...prev, data.blockedDate].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        )
      )
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
      const res = await fetch(`/api/expert-blocked-dates/${id}`, { method: 'DELETE' })
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
          Mis dias bloqueados
        </CardTitle>
        <CardDescription>
          Bloquea fechas en las que no estaras disponible
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FieldGroup>
          <div className="flex gap-2">
            <Field className="flex-1">
              <Input
                type="date"
                min={today}
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </Field>
            <Field className="flex-1">
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
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CalendarOff className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>Sin dias bloqueados</EmptyTitle>
              <EmptyDescription>No tienes fechas bloqueadas configuradas</EmptyDescription>
            </EmptyHeader>
          </Empty>
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
                  onClick={() => setPendingDelete(blocked)}
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

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => { if (!open) setPendingDelete(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar dia bloqueado</AlertDialogTitle>
            <AlertDialogDescription>
              Estas seguro de que quieres eliminar el bloqueo del <strong>{pendingDelete ? formatDate(pendingDelete.date) : ''}</strong>? Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (pendingDelete) { handleRemoveDate(pendingDelete.id); setPendingDelete(null) } }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
