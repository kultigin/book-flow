import { requireAuth } from '@/lib/auth'
import { headers } from 'next/headers'
import { ChangePasswordForm } from '@/components/dashboard/change-password-form'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ExternalLink, Link2, UserCircle } from 'lucide-react'

export default async function ProfilePage() {
  const { accountHolder } = await requireAuth()
  const headersList = await headers()
  const host = headersList.get('host') || 'localhost:3000'
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  const bookingUrl = accountHolder.slug ? `${protocol}://${host}/book/${accountHolder.slug}` : null

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mi perfil</h1>
        <p className="text-muted-foreground">Gestiona tu cuenta y contraseña</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5" />
            Información de cuenta
          </CardTitle>
          <CardDescription>Datos de tu cuenta de acceso</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-muted-foreground">Nombre</span>
            <span className="text-sm font-medium">{accountHolder.name}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm font-medium">{accountHolder.email}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Rol</span>
            <Badge variant={accountHolder.role === 'admin' ? 'default' : 'secondary'}>
              {accountHolder.role === 'admin' ? 'Admin' : 'Staff'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Booking link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Enlace de reservas
          </CardTitle>
          <CardDescription>Tu página pública donde los clientes pueden reservar</CardDescription>
        </CardHeader>
        <CardContent>
          {bookingUrl ? (
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-mono text-primary hover:bg-primary/5 transition-colors break-all"
            >
              <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
              {bookingUrl}
            </a>
          ) : (
            <p className="text-sm text-muted-foreground">
              No tienes un enlace de reservas configurado. Pide a tu administrador que añada un slug a tu perfil en la sección de Equipo.
            </p>
          )}
        </CardContent>
      </Card>

      <ChangePasswordForm />
    </div>
  )
}
