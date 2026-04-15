'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { Building, Globe, MapPin, Phone } from 'lucide-react'

interface Business {
  id: string
  name: string
  slug: string
  description?: string
  address?: string
  phone?: string
}

interface BusinessSettingsProps {
  business: Business
}

export function BusinessSettings({ business }: BusinessSettingsProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    name: business.name,
    description: business.description || '',
    address: business.address || '',
    phone: business.phone || ''
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setIsSaving(true)

    try {
      const res = await fetch('/api/business', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business.id,
          ...formData
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al guardar')
        return
      }

      setSuccess(true)
      router.refresh()
    } catch {
      setError('Error de conexion')
    } finally {
      setIsSaving(false)
    }
  }

  const bookingUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/book/${business.slug}`
    : `/book/${business.slug}`

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Datos del negocio
          </CardTitle>
          <CardDescription>
            Informacion que veran tus clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Nombre del negocio</FieldLabel>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="description">Descripcion</FieldLabel>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe tu negocio..."
                  rows={3}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="address">Direccion</FieldLabel>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Tu direccion"
                    className="pl-10"
                  />
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="phone">Telefono de contacto</FieldLabel>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+34 912 345 678"
                    className="pl-10"
                  />
                </div>
              </Field>
            </FieldGroup>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && <p className="text-sm text-success">Cambios guardados correctamente</p>}

            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Spinner className="mr-2 h-4 w-4" /> : null}
              {isSaving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Enlace de reservas
          </CardTitle>
          <CardDescription>
            Comparte este enlace con tus clientes para que puedan reservar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={bookingUrl}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              onClick={() => navigator.clipboard.writeText(bookingUrl)}
            >
              Copiar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
