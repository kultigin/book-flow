'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
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
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Clock, Pencil, Trash2, Tag, Users, X, Calendar } from 'lucide-react'

const DAYS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

interface Schedule {
  id?: string
  day_of_week: number
  start_time: string
}

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
  is_group: boolean
  max_capacity: number | null
  schedules: Schedule[]
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
  is_group: false,
  max_capacity: 10,
  schedules: [] as Schedule[],
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
      is_group: treatment.is_group ?? false,
      max_capacity: treatment.max_capacity ?? 10,
      schedules: treatment.schedules ?? [],
    })
    setError('')
    setDialogOpen(true)
  }

  function addSchedule() {
    setFormData(p => ({ ...p, schedules: [...p.schedules, { day_of_week: 1, start_time: '09:00' }] }))
  }

  function removeSchedule(idx: number) {
    setFormData(p => ({ ...p, schedules: p.schedules.filter((_, i) => i !== idx) }))
  }

  function updateSchedule(idx: number, field: keyof Schedule, value: number | string) {
    setFormData(p => ({
      ...p,
      schedules: p.schedules.map((s, i) => i === idx ? { ...s, [field]: value } : s),
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (formData.is_group) {
      if (!formData.max_capacity || Number(formData.max_capacity) < 2) {
        setError('La capacidad máxima debe ser al menos 2')
        return
      }
      if (formData.schedules.length === 0) {
        setError('Agrega al menos un horario para sesiones grupales')
        return
      }
      if (formData.schedules.some(s => !s.start_time)) {
        setError('Todos los horarios deben tener hora asignada')
        return
      }
    }

    setIsSaving(true)
    try {
      const body = {
        name: formData.name,
        duration_minutes: Number(formData.duration_minutes),
        price: formData.price !== '' ? Number(formData.price) : null,
        description: formData.description || null,
        expert_id: formData.expert_id || currentUserId,
        is_group: formData.is_group,
        max_capacity: formData.is_group ? Number(formData.max_capacity) : null,
        schedules: formData.is_group ? formData.schedules.map(s => ({ day_of_week: s.day_of_week, start_time: s.start_time })) : [],
      }

      const url = editingTreatment ? `/api/treatments/${editingTreatment.id}` : '/api/treatments'
      const method = editingTreatment ? 'PATCH' : 'POST'

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
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
      toast.success(editingTreatment ? 'Tratamiento actualizado' : 'Tratamiento creado')
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
        toast.success('Tratamiento eliminado')
        router.refresh()
      } else {
        toast.error('Error al eliminar tratamiento')
      }
    } catch {
      toast.error('Error de conexion')
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
              <div key={treatment.id} className="flex items-start justify-between gap-4 rounded-lg border p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{treatment.name}</span>
                    {treatment.is_group && (
                      <Badge variant="secondary" className="text-xs flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Grupal
                      </Badge>
                    )}
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
                        €{Number(treatment.price).toFixed(0)}
                      </span>
                    )}
                    {treatment.is_group && treatment.max_capacity && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        Hasta {treatment.max_capacity} personas
                      </span>
                    )}
                    {treatment.description && (
                      <span className="truncate max-w-xs">{treatment.description}</span>
                    )}
                  </div>
                  {treatment.is_group && treatment.schedules?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {treatment.schedules.map((s, i) => (
                        <span key={i} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {DAYS_ES[s.day_of_week]} {s.start_time.slice(0, 5)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Switch checked={treatment.is_active} onCheckedChange={() => handleToggleActive(treatment)} />
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(treatment)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPendingDelete(treatment)}
                    disabled={deletingId === treatment.id}
                    className="text-destructive hover:text-destructive"
                  >
                    {deletingId === treatment.id ? <Spinner className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTreatment ? 'Editar tratamiento' : 'Agregar tratamiento'}</DialogTitle>
            <DialogDescription>
              {editingTreatment ? 'Modifica los datos del tratamiento' : 'Crea un nuevo tratamiento'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FieldGroup>
              {/* Session type toggle */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{formData.is_group ? 'Sesión grupal' : 'Sesión individual'}</p>
                  <p className="text-xs text-muted-foreground">
                    {formData.is_group ? 'Horario fijo, múltiples participantes' : 'Reserva por hora, un cliente'}
                  </p>
                </div>
                <Switch
                  checked={formData.is_group}
                  onCheckedChange={(v) => setFormData(p => ({ ...p, is_group: v }))}
                />
              </div>

              <Field>
                <FieldLabel htmlFor="t-name">Nombre</FieldLabel>
                <Input
                  id="t-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={formData.is_group ? 'Ej. Yoga matutino' : 'Ej. Masaje relajante'}
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
                        <SelectItem key={expert.id} value={expert.id}>{expert.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}

              <Field>
                <FieldLabel htmlFor="t-duration">Duración (minutos)</FieldLabel>
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
                  placeholder="Ej. 15.00"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="t-description">Descripción (opcional)</FieldLabel>
                <Textarea
                  id="t-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción breve"
                  rows={2}
                />
              </Field>

              {/* Group-only fields */}
              {formData.is_group && (
                <>
                  <Field>
                    <FieldLabel htmlFor="t-capacity">Capacidad máxima</FieldLabel>
                    <Input
                      id="t-capacity"
                      type="number"
                      min={2}
                      value={formData.max_capacity}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_capacity: Number(e.target.value) }))}
                      required
                    />
                  </Field>

                  <div className="space-y-2">
                    <FieldLabel>Horarios recurrentes</FieldLabel>
                    {formData.schedules.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        Agrega los días y horas en que se repite esta clase.
                      </p>
                    )}
                    <div className="space-y-2">
                      {formData.schedules.map((s, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Select
                            value={String(s.day_of_week)}
                            onValueChange={(v) => updateSchedule(idx, 'day_of_week', Number(v))}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {DAYS_ES.map((day, i) => (
                                <SelectItem key={i} value={String(i)}>{day}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            type="time"
                            value={s.start_time}
                            onChange={(e) => updateSchedule(idx, 'start_time', e.target.value)}
                            className="w-28"
                            required
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            onClick={() => removeSchedule(idx)}
                            className="shrink-0 text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" type="button" onClick={addSchedule}>
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Agregar horario
                    </Button>
                  </div>
                </>
              )}
            </FieldGroup>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
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
              ¿Estás seguro de que quieres eliminar <strong>{pendingDelete?.name}</strong>? Esta acción no se puede deshacer.
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
