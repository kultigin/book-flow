'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, Mail, Lock, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handlePasswordLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al iniciar sesion')
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Error de conexion')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleMagicLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const email = formData.get('magic-email') as string

    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al enviar enlace')
        return
      }

      setMagicLinkSent(true)
    } catch {
      setError('Error de conexion')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Iniciar Sesion</CardTitle>
          <CardDescription>
            Accede a tu panel de gestion de reservas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {magicLinkSent ? (
            <div className="text-center py-6">
              <Mail className="h-12 w-12 mx-auto text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">Revisa tu correo</h3>
              <p className="text-muted-foreground text-sm">
                Te hemos enviado un enlace para iniciar sesion. El enlace expira en 15 minutos.
              </p>
              <Button
                variant="ghost"
                className="mt-4"
                onClick={() => setMagicLinkSent(false)}
              >
                Volver a intentar
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="password" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="password">Contrasena</TabsTrigger>
                <TabsTrigger value="magic-link">Enlace magico</TabsTrigger>
              </TabsList>

              <TabsContent value="password">
                <form onSubmit={handlePasswordLogin} className="space-y-4 mt-4">
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="email">Correo electronico</FieldLabel>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="tu@email.com"
                          className="pl-10"
                          required
                        />
                      </div>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="password">Contrasena</FieldLabel>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Tu contrasena"
                          className="pl-10 pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(p => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </Field>
                  </FieldGroup>

                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Iniciando sesion...' : 'Iniciar sesion'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="magic-link">
                <form onSubmit={handleMagicLink} className="space-y-4 mt-4">
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="magic-email">Correo electronico</FieldLabel>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="magic-email"
                          name="magic-email"
                          type="email"
                          placeholder="tu@email.com"
                          className="pl-10"
                          required
                        />
                      </div>
                    </Field>
                  </FieldGroup>

                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Enviando enlace...' : 'Enviar enlace magico'}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Recibiras un enlace en tu correo para iniciar sesion sin contrasena
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
