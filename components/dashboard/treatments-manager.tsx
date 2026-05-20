'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Clock, Pencil, Trash2, Tag } from 'lucide-react'

interface Treatment {
  id: string
  business_id: string
  expert_id: string
  expert_name: string
  name: string
  duration_minutes: number
  price: number | null
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

interface Expert {
  id: string
  name: string
}

interface TreatmentsManagerProps {
  initialTreatments: Treatment[]
  experts: Expert[]
  currentUserId: string
  isAdmin: boolean
}

const emptyForm = {
  name: '',
  duration_minutes: 60,
  price: '',
  description: '',
  expert_id: '',
}

export function TreatmentsManager({ initialTreatments, experts, currentUserId, isAdmin }: TreatmentsManagerProps) {
  const router = useRouter()
  const [treatments, setTreatments] = useState(initialTreatments)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Treatment | null>(null)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState(emptyForm)

  function openAddDialog() {
    setEditingTreatment(null)
    setFormData({ ...emptyForm, expert_id: isAdmin ? '' : currentUserId })
    setError('')
    setDialogOpen(true)
  }

  function openEditDialog(treatment: Treatment) {
    setEditingTreatment(treatment)
    setFormData({
      name: treatment.name,
      duration_minutes: treatment.duration_minutes,
      price: treatment.price !== null ? String(treatment.price) : '',
      description: treatment.description ?? '',
      expert_id: treatment.expert_id,
    })
    setError('')
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsSaving(true)

    try {
      const body = {
        name: formData.name,
        duration_minutes: Number(formData.duration_minutes),
        price: formData.price !== '' ? Number(formData.price) : null,
        description: formData.description || null,
        expert_id: formData.expert_id || currentUserId,
      }

      const url = editingTreatment ? `/api/treatments/${editingTreatment.id}` : '/api/treatments'
      const method = editingTreatment ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al guardar')
        return
      }

      if (editingTreatment) {
        setTreatments(prev => prev.map(t => t.id === editingTreatment.id ? data.treatment : t))
      } else {
        setTreatments(prev => [...prev, data.treatment])
      }

      setDialogOpen(false)
      router.refresh()
    } catch {
      setError('Error de conexion')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/treatments/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setTreatments(prev => prev.filter(t => t.id !== id))
        router.refresh()
      }
    } catch (err) {
      console.error('Delete error:', err)
    } finally {
      setDeletingId(null)
    }
  }

  async function handleToggleActive(treatment: Treatment) {
    try {
      const res = await fetch(`/api/treatments/${treatment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !treatment.is_active }),
      })
      if (res.ok) {
        const data = await res.json()
        setTreatments(prev => prev.map(t => t.id === treatment.id ? data.treatment : t))
      }
    } catch (err) {
      console.error('Toggle error:', err)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Tratamientos</CardTitle>
          <CardDescription>
            {treatments.length} {treatments.length === 1 ? 'tratamiento' : 'tratamientos'} configurados
          </CardDescription>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar tratamiento
        </Button>
      </CardHeader>

      <CardContent>
        {treatments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
            <Tag className="mb-3 h-10 w-10 opacity-30" />
            <p className="text-sm">No hay tratamientos aun.</p>
            <p className="text-sm">Agrega el primero para comenzar.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {treatments.map((treatment) => (
              <div
                key={treatment.id}
                className="flex items-center justify-between gap-4 rounded-lg border p-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{treatment.name}</span>
                    {!treatment.is_active && (
                      <Badge variant="secondary" className="text-xs">Inactivo</Badge>
                    )}
                    {isAdmin && (
                      <Badge variant="outline" className="text-xs">{treatment.expert_name}</Badge>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {treatment.duration_minutes} min
                    </span>
                    {treatment.price !== null && (
                      <span className="flex items-center gap-1">
                        <Tag className="h-3.5 w-3.5" />
                        ${Number(treatment.price).toFixed(2)}
                      </span>
                    )}
                    {treatment.description && (
                      <span className="truncate max-w-xs">{treatment.description}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={treatment.is_active}
                    onCheckedChange={() => handleToggleActive(treatment)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(treatment)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPendingDelete(treatment)}
                    disabled={deletingId === treatment.id}
                    className="text-destructive hover:text-destructive"
                  >
                    {deletingId === treatment.id
                      ? <Spinner className="h-4 w-4" />
                      : <Trash2 className="h-4 w-4" />
                    }
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTreatment ? 'Editar tratamiento' : 'Agregar tratamiento'}</DialogTitle>
            <DialogDescription>
              {editingTreatment ? 'Modifica los datos del tratamiento' : 'Crea un nuevo tratamiento'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="t-name">Nombre</FieldLabel>
                <Input
                  id="t-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej. Masaje relajante"
                  required
                />
              </Field>

              {isAdmin && (
                <Field>
                  <FieldLabel htmlFor="t-expert">Experto</FieldLabel>
                  <Select
                    value={formData.expert_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, expert_id: value }))}
                    required
                  >
                    <SelectTrigger id="t-expert">
                      <SelectValue placeholder="Seleccionar experto" />
                    </SelectTrigger>
                    <SelectContent>
                      {experts.map((expert) => (
                        <SelectItem key={expert.id} value={expert.id}>
                          {expert.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}

              <Field>
                <FieldLabel htmlFor="t-duration">Duracion (minutos)</FieldLabel>
                <Input
                  id="t-duration"
                  type="number"
                  min={5}
                  step={5}
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: Number(e.target.value) }))}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="t-price">Precio (opcional)</FieldLabel>
                <Input
                  id="t-price"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="Ej. 50.00"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="t-description">Descripcion (opcional)</FieldLabel>
                <Textarea
                  id="t-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripcion breve del tratamiento"
                  rows={3}
                />
              </Field>
            </FieldGroup>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Spinner className="mr-2 h-4 w-4" /> : null}
                {isSaving ? 'Guardando...' : editingTreatment ? 'Guardar cambios' : 'Agregar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => { if (!open) setPendingDelete(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar tratamiento</AlertDialogTitle>
            <AlertDialogDescription>
              Estas seguro de que quieres eliminar <strong>{pendingDelete?.name}</strong>? Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (pendingDelete) { handleDelete(pendingDelete.id); setPendingDelete(null) } }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
