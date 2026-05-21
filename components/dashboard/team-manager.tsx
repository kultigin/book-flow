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
import { Plus, UserCircle, Mail, Shield, Trash2, Pencil, Link2, Copy, Check } from 'lucide-react'

interface Treatment {
  id: string
  name: string
  duration_minutes: number
}

interface TeamMember {
  id: string
  name: string
  email: string
  role: 'admin' | 'staff'
  slug: string | null
  bio: string | null
  is_active: boolean
  created_at: string
  treatments: Treatment[]
  upcoming_bookings_count: number
}

interface TeamManagerProps {
  businessId: string
  initialMembers: TeamMember[]
  currentUserId: string
}

const emptyAddForm = {
  name: '',
  email: '',
  password: '',
  role: 'staff' as 'admin' | 'staff',
  slug: '',
}

export function TeamManager({ businessId, initialMembers, currentUserId }: TeamManagerProps) {
  const router = useRouter()
  const [members, setMembers] = useState(initialMembers)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<TeamMember | null>(null)
  const [addError, setAddError] = useState('')
  const [editError, setEditError] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)

  const [addForm, setAddForm] = useState(emptyAddForm)
  const [editForm, setEditForm] = useState({
    name: '',
    slug: '',
    bio: '',
    role: 'staff' as 'admin' | 'staff',
  })

  function openEditDialog(member: TeamMember) {
    setEditingMember(member)
    setEditForm({
      name: member.name,
      slug: member.slug ?? '',
      bio: member.bio ?? '',
      role: member.role,
    })
    setEditError('')
    setEditDialogOpen(true)
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault()
    setAddError('')
    setIsAdding(true)
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, ...addForm }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAddError(data.error || 'Error al agregar miembro')
        return
      }
      setMembers(prev => [...prev, { ...data.member, treatments: [] }])
      setAddDialogOpen(false)
      setAddForm(emptyAddForm)
      router.refresh()
    } catch {
      setAddError('Error de conexion')
    } finally {
      setIsAdding(false)
    }
  }

  async function handleEditMember(e: React.FormEvent) {
    e.preventDefault()
    if (!editingMember) return
    setEditError('')
    setIsSaving(true)
    try {
      const res = await fetch(`/api/team/${editingMember.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      const data = await res.json()
      if (!res.ok) {
        setEditError(data.error || 'Error al guardar')
        return
      }
      setMembers(prev =>
        prev.map(m =>
          m.id === editingMember.id
            ? { ...m, ...data.member, treatments: m.treatments }
            : m
        )
      )
      setEditDialogOpen(false)
      router.refresh()
    } catch {
      setEditError('Error de conexion')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleToggleActive(member: TeamMember) {
    setTogglingId(member.id)
    try {
      const res = await fetch(`/api/team/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !member.is_active }),
      })
      if (res.ok) {
        setMembers(prev =>
          prev.map(m => m.id === member.id ? { ...m, is_active: !m.is_active } : m)
        )
      }
    } catch (err) {
      console.error('Toggle error:', err)
    } finally {
      setTogglingId(null)
    }
  }

  async function handleDelete(memberId: string) {
    setIsDeletingId(memberId)
    try {
      const res = await fetch(`/api/team/${memberId}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) {
        setMembers(prev => prev.filter(m => m.id !== memberId))
        setPendingDelete(null)
        setDeleteError('')
        router.refresh()
      } else {
        setDeleteError(data.error || 'Error al eliminar miembro')
      }
    } catch (err) {
      console.error('Delete error:', err)
      setDeleteError('Error de conexion')
    } finally {
      setIsDeletingId(null)
    }
  }

  function copyBookingLink(member: TeamMember) {
    if (!member.slug) return
    const url = `${window.location.origin}/book/${member.slug}`
    navigator.clipboard.writeText(url)
    setCopiedId(member.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Miembros del equipo</CardTitle>
          <CardDescription>{members.length} miembros en tu equipo</CardDescription>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Agregar miembro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar miembro</DialogTitle>
              <DialogDescription>Agrega un nuevo experto a tu equipo</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddMember} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="add-name">Nombre</FieldLabel>
                  <Input
                    id="add-name"
                    value={addForm.name}
                    onChange={(e) => setAddForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Nombre completo"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="add-email">Email</FieldLabel>
                  <Input
                    id="add-email"
                    type="email"
                    value={addForm.email}
                    onChange={(e) => setAddForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="correo@ejemplo.com"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="add-password">Contrasena</FieldLabel>
                  <Input
                    id="add-password"
                    type="password"
                    value={addForm.password}
                    onChange={(e) => setAddForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="Minimo 8 caracteres"
                    required
                    minLength={8}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="add-slug">Slug de reservas (opcional)</FieldLabel>
                  <Input
                    id="add-slug"
                    value={addForm.slug}
                    onChange={(e) => setAddForm(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))}
                    placeholder="ej. ashtanga-yoga"
                  />
                  {addForm.slug && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Link: /book/{addForm.slug}
                    </p>
                  )}
                </Field>
                <Field>
                  <FieldLabel htmlFor="add-role">Rol</FieldLabel>
                  <Select
                    value={addForm.role}
                    onValueChange={(v: 'admin' | 'staff') => setAddForm(p => ({ ...p, role: v }))}
                  >
                    <SelectTrigger id="add-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Staff - Experto</SelectItem>
                      <SelectItem value="admin">Admin - Acceso completo</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>
              {addError && <p className="text-sm text-destructive">{addError}</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isAdding}>
                  {isAdding && <Spinner className="mr-2 h-4 w-4" />}
                  {isAdding ? 'Agregando...' : 'Agregar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {members.map((member) => (
            <div key={member.id} className="rounded-lg border p-4 space-y-3">
              {/* Header row */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <UserCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{member.name}</span>
                      {member.id === currentUserId && (
                        <Badge variant="outline" className="text-xs">Tu</Badge>
                      )}
                      <Badge variant={member.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                        {member.role === 'admin' ? 'Admin' : 'Staff'}
                      </Badge>
                      {!member.is_active && (
                        <Badge variant="destructive" className="text-xs">Inactivo</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" />
                        {member.email}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Switch
                    checked={member.is_active}
                    onCheckedChange={() => handleToggleActive(member)}
                    disabled={togglingId === member.id}
                  />
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(member)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {member.id !== currentUserId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setPendingDelete(member); setDeleteError('') }}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Bio */}
              {member.bio && (
                <p className="text-sm text-muted-foreground line-clamp-2">{member.bio}</p>
              )}

              {/* Booking link */}
              {member.slug ? (
                <div className="flex items-center gap-2">
                  <Link2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm text-primary font-mono">/book/{member.slug}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2"
                    onClick={() => copyBookingLink(member)}
                  >
                    {copiedId === member.id
                      ? <Check className="h-3.5 w-3.5 text-success" />
                      : <Copy className="h-3.5 w-3.5" />
                    }
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Link2 className="h-3.5 w-3.5" />
                  Sin slug configurado — edita para agregar URL de reservas
                </p>
              )}

              {/* Treatments */}
              {member.treatments.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {member.treatments.map((t) => (
                    <Badge key={t.id} variant="outline" className="text-xs">
                      {t.name} · {t.duration_minutes} min
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>

      {/* Edit dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar miembro</DialogTitle>
            <DialogDescription>Actualiza el perfil de {editingMember?.name}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditMember} className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="edit-name">Nombre</FieldLabel>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm(p => ({ ...p, name: e.target.value }))}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="edit-slug">Slug de reservas</FieldLabel>
                <Input
                  id="edit-slug"
                  value={editForm.slug}
                  onChange={(e) => setEditForm(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))}
                  placeholder="ej. ashtanga-yoga"
                />
                {editForm.slug && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Link publico: /book/{editForm.slug}
                  </p>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="edit-bio">Bio</FieldLabel>
                <Textarea
                  id="edit-bio"
                  value={editForm.bio}
                  onChange={(e) => setEditForm(p => ({ ...p, bio: e.target.value }))}
                  placeholder="Descripcion breve del experto..."
                  rows={3}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="edit-role">Rol</FieldLabel>
                <Select
                  value={editForm.role}
                  onValueChange={(v: 'admin' | 'staff') => setEditForm(p => ({ ...p, role: v }))}
                >
                  <SelectTrigger id="edit-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff - Experto</SelectItem>
                    <SelectItem value="admin">Admin - Acceso completo</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
            {editError && <p className="text-sm text-destructive">{editError}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Spinner className="mr-2 h-4 w-4" />}
                {isSaving ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => { if (!open) { setPendingDelete(null); setDeleteError('') } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar miembro</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete && pendingDelete.upcoming_bookings_count > 0
                ? <>
                    <strong>{pendingDelete.name}</strong> tiene{' '}
                    <strong>{parseInt(String(pendingDelete.upcoming_bookings_count))} reserva{parseInt(String(pendingDelete.upcoming_bookings_count)) !== 1 ? 's' : ''} pendiente{parseInt(String(pendingDelete.upcoming_bookings_count)) !== 1 ? 's' : ''}</strong>.
                    Cancela o reasigna las reservas antes de eliminar este miembro.
                  </>
                : <>
                    ¿Estás seguro de que quieres eliminar a <strong>{pendingDelete?.name}</strong>? Se eliminará su cuenta y no podrá acceder al panel.
                  </>
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={
                parseInt(String(pendingDelete?.upcoming_bookings_count ?? 0)) > 0 ||
                isDeletingId === pendingDelete?.id
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => { if (pendingDelete) { setDeleteError(''); handleDelete(pendingDelete.id) } }}
            >
              {isDeletingId === pendingDelete?.id ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
