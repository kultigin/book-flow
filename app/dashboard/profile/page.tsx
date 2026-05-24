import { requireAuth } from '@/lib/auth'
import { headers } from 'next/headers'
import { sql } from '@/lib/db'
import { ChangePasswordForm } from '@/components/dashboard/change-password-form'
import { ProfileForm } from '@/components/dashboard/profile-form'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const { accountHolder } = await requireAuth()
  const headersList = await headers()
  const host = headersList.get('host') || 'localhost:3000'
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'

  const rows = await sql`
    SELECT avatar_url FROM account_holders WHERE id = ${accountHolder.id}
  `
  const hasAvatar = !!rows[0]?.avatar_url

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

      {/* Avatar + slug editing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5" />
            Foto y enlace de reservas
          </CardTitle>
          <CardDescription>Tu foto de perfil y enlace público para que los clientes reserven</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            accountHolderId={accountHolder.id}
            name={accountHolder.name}
            currentSlug={accountHolder.slug}
            hasAvatar={hasAvatar}
            host={host}
            protocol={protocol}
          />
        </CardContent>
      </Card>

      <ChangePasswordForm />
    </div>
  )
}
