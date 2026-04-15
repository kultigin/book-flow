import { requireAdmin, getBusinessById } from '@/lib/auth'
import { BusinessSettings } from '@/components/dashboard/business-settings'

export default async function SettingsPage() {
  const { accountHolder } = await requireAdmin()
  const business = await getBusinessById(accountHolder.business_id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configuracion</h1>
        <p className="text-muted-foreground">
          Configura los datos de tu negocio
        </p>
      </div>

      <BusinessSettings business={business} />
    </div>
  )
}
