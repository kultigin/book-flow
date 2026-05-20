import { requireAuth } from '@/lib/auth'
import { ChangePasswordForm } from '@/components/dashboard/change-password-form'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserCircle } from 'lucide-react'

export default async function ProfilePage() {
  const { accountHolder } = await requireAuth()

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mi perfil</h1>
        <p className="text-muted-foreground">Gestiona tu cuenta y contrasena</p>
      </div>

      {/* Account info — read only */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5" />
            Informacion de cuenta
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

      <ChangePasswordForm />
    </div>
  )
}
