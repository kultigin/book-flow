'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
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
import { Plus, UserCircle, Mail, Shield, Trash2 } from 'lucide-react'

interface TeamMember {
  id: string
  name: string
  email: string
  role: 'admin' | 'staff'
  created_at: string
}

interface TeamManagerProps {
  businessId: string
  initialMembers: TeamMember[]
  currentUserId: string
}

export function TeamManager({ businessId, initialMembers, currentUserId }: TeamManagerProps) {
  const router = useRouter()
  const [members, setMembers] = useState(initialMembers)
  const [isAdding, setIsAdding] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff' as 'admin' | 'staff'
  })

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsAdding(true)

    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          ...formData
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al agregar miembro')
        return
      }

      setMembers(prev => [...prev, data.member])
      setDialogOpen(false)
      setFormData({ name: '', email: '', password: '', role: 'staff' })
      router.refresh()
    } catch {
      setError('Error de conexion')
    } finally {
      setIsAdding(false)
    }
  }

  async function deleteMember(memberId: string) {
    try {
      const res = await fetch(`/api/team/${memberId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setMembers(prev => prev.filter(m => m.id !== memberId))
        router.refresh()
      }
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Miembros del equipo</CardTitle>
          <CardDescription>
            {members.length} miembros en tu equipo
          </CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Agregar miembro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar miembro</DialogTitle>
              <DialogDescription>
                Agrega un nuevo miembro a tu equipo
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddMember} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="name">Nombre</FieldLabel>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nombre completo"
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="correo@ejemplo.com"
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="password">Contrasena</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Contrasena segura"
                    required
                    minLength={8}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="role">Rol</FieldLabel>
                  <Select
                    value={formData.role}
                    onValueChange={(value: 'admin' | 'staff') => setFormData(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Staff - Solo reservas</SelectItem>
                      <SelectItem value="admin">Admin - Acceso completo</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isAdding}>
                  {isAdding ? <Spinner className="mr-2 h-4 w-4" /> : null}
                  {isAdding ? 'Agregando...' : 'Agregar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between gap-4 rounded-lg border p-4"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <UserCircle className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{member.name}</span>
                    {member.id === currentUserId && (
                      <Badge variant="outline" className="text-xs">Tu</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      {member.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Shield className="h-3.5 w-3.5" />
                      {member.role === 'admin' ? 'Admin' : 'Staff'}
                    </span>
                  </div>
                </div>
              </div>

              {member.id !== currentUserId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMember(member.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
