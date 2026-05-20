'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { Eye, EyeOff, KeyRound, Check } from 'lucide-react'

const emptyForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

export function ChangePasswordForm() {
  const [form, setForm] = useState(emptyForm)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const passwordsMatch =
    form.newPassword.length > 0 &&
    form.confirmPassword.length > 0 &&
    form.newPassword === form.confirmPassword

  const passwordsMismatch =
    form.confirmPassword.length > 0 && form.newPassword !== form.confirmPassword

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (form.newPassword !== form.confirmPassword) {
      setError('Las contrasenas nuevas no coinciden')
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch('/api/account/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
          confirmPassword: form.confirmPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al cambiar la contrasena')
        return
      }

      setSuccess(true)
      setForm(emptyForm)
    } catch {
      setError('Error de conexion')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5" />
          Cambiar contrasena
        </CardTitle>
        <CardDescription>
          Usa una contrasena segura que no uses en otros sitios
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="cp-current">Contrasena actual</FieldLabel>
              <div className="relative">
                <Input
                  id="cp-current"
                  type={showCurrent ? 'text' : 'password'}
                  value={form.currentPassword}
                  onChange={(e) => setForm(p => ({ ...p, currentPassword: e.target.value }))}
                  placeholder="Tu contrasena actual"
                  className="pr-10"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowCurrent(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            <Field>
              <FieldLabel htmlFor="cp-new">Nueva contrasena</FieldLabel>
              <div className="relative">
                <Input
                  id="cp-new"
                  type={showNew ? 'text' : 'password'}
                  value={form.newPassword}
                  onChange={(e) => setForm(p => ({ ...p, newPassword: e.target.value }))}
                  placeholder="Minimo 8 caracteres"
                  className="pr-10"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowNew(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            <Field>
              <FieldLabel htmlFor="cp-confirm">Confirmar nueva contrasena</FieldLabel>
              <div className="relative">
                <Input
                  id="cp-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={(e) => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
                  placeholder="Repite la nueva contrasena"
                  className={`pr-10 ${passwordsMismatch ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordsMismatch && (
                <p className="text-xs text-destructive mt-1">Las contrasenas no coinciden</p>
              )}
              {passwordsMatch && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Las contrasenas coinciden
                </p>
              )}
            </Field>
          </FieldGroup>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && (
            <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
              <Check className="h-4 w-4" />
              Contrasena actualizada correctamente
            </p>
          )}

          <Button type="submit" disabled={isSaving || passwordsMismatch}>
            {isSaving && <Spinner className="mr-2 h-4 w-4" />}
            {isSaving ? 'Guardando...' : 'Cambiar contrasena'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
