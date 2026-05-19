'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { Users, Search, Phone, Mail, Calendar } from 'lucide-react'

interface Client {
  id: string
  name: string
  phone: string
  email?: string
  is_verified: boolean
  total_bookings: number
  last_booking?: string
  created_at: string
}

interface ClientsListProps {
  clients: Client[]
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-ES', { 
    day: 'numeric', 
    month: 'short',
    year: 'numeric'
  })
}

export function ClientsList({ clients }: ClientsListProps) {
  const [search, setSearch] = useState('')

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(search.toLowerCase()) ||
    client.phone.includes(search) ||
    (client.email && client.email.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, telefono o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filteredClients.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Users className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>Sin clientes</EmptyTitle>
              <EmptyDescription>
                {search ? 'No se encontraron clientes con ese criterio' : 'No hay clientes registrados'}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="space-y-3">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                className="flex items-start justify-between gap-4 rounded-lg border p-4"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{client.name}</span>
                    {client.is_verified && (
                      <Badge variant="outline" className="text-xs">Verificado</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {client.phone}
                    </span>
                    {client.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" />
                        {client.email}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">{client.total_bookings}</span>
                    <span className="text-muted-foreground">reservas</span>
                  </div>
                  {client.last_booking && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Ultima: {formatDate(client.last_booking)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
