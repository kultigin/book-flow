'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import useSWR from 'swr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Empty } from '@/components/ui/empty'
import { Spinner } from '@/components/ui/spinner'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
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
import { Calendar, Clock, Phone, Building, XCircle, Search } from 'lucide-react'

interface Booking {
  id: string
  date: string
  start_time: string
  end_time: string
  status: string
  notes?: string
  business_name: string
  business_slug: string
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-ES', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long',
    year: 'numeric'
  })
}

function formatTime(time: string) {
  return time.slice(0, 5)
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'confirmed':
      return <Badge className="bg-success text-success-foreground">Confirmada</Badge>
    case 'pending':
      return <Badge variant="secondary">Pendiente</Badge>
    case 'cancelled':
      return <Badge variant="destructive">Cancelada</Badge>
    case 'completed':
      return <Badge variant="outline">Completada</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

function MyBookingsContent() {
  const searchParams = useSearchParams()
  const phoneFromUrl = searchParams.get('phone') || ''
  
  const [phone, setPhone] = useState(phoneFromUrl)
  const [searchPhone, setSearchPhone] = useState(phoneFromUrl)
  const [verificationCode, setVerificationCode] = useState('')
  const [isVerified, setIsVerified] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [error, setError] = useState('')
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  const { data, isLoading, mutate } = useSWR(
    isVerified && searchPhone ? `/api/public/my-bookings?phone=${encodeURIComponent(searchPhone)}` : null,
    fetcher
  )

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsSendingCode(true)

    try {
      const res = await fetch('/api/public/send-lookup-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al enviar el codigo')
        return
      }

      setSearchPhone(phone)
    } catch {
      setError('Error de conexion')
    } finally {
      setIsSendingCode(false)
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsVerifying(true)

    try {
      const res = await fetch('/api/public/verify-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: searchPhone, code: verificationCode })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Codigo invalido')
        return
      }

      setIsVerified(true)
    } catch {
      setError('Error de conexion')
    } finally {
      setIsVerifying(false)
    }
  }

  async function handleCancelBooking() {
    if (!selectedBooking) return
    
    setIsCancelling(true)
    try {
      const res = await fetch(`/api/public/cancel-booking/${selectedBooking.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: searchPhone })
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Error al cancelar')
        return
      }

      mutate()
      setCancelDialogOpen(false)
      setSelectedBooking(null)
    } catch {
      setError('Error de conexion')
    } finally {
      setIsCancelling(false)
    }
  }

  // Auto-send code if phone is in URL
  useEffect(() => {
    if (phoneFromUrl && !searchPhone) {
      setPhone(phoneFromUrl)
      setSearchPhone(phoneFromUrl)
      fetch('/api/public/send-lookup-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneFromUrl })
      })
    }
  }, [phoneFromUrl, searchPhone])

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Mis Reservas</CardTitle>
            <CardDescription>
              Consulta y gestiona tus citas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!searchPhone ? (
              <form onSubmit={handleSendCode} className="space-y-4">
                <Field>
                  <FieldLabel htmlFor="phone">Tu numero de telefono</FieldLabel>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+34 612 345 678"
                      className="pl-10"
                      required
                    />
                  </div>
                </Field>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button type="submit" className="w-full" disabled={isSendingCode}>
                  {isSendingCode ? <Spinner className="mr-2 h-4 w-4" /> : <Search className="mr-2 h-4 w-4" />}
                  {isSendingCode ? 'Enviando...' : 'Buscar mis reservas'}
                </Button>
              </form>
            ) : !isVerified ? (
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="text-center mb-4">
                  <p className="text-muted-foreground">
                    Hemos enviado un codigo a
                  </p>
                  <p className="font-medium">{searchPhone}</p>
                </div>

                <Field>
                  <FieldLabel htmlFor="code">Codigo de verificacion</FieldLabel>
                  <Input
                    id="code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    className="text-center text-2xl tracking-widest"
                    maxLength={6}
                    required
                  />
                </Field>

                {error && <p className="text-sm text-destructive text-center">{error}</p>}

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isVerifying || verificationCode.length !== 6}
                >
                  {isVerifying ? <Spinner className="mr-2 h-4 w-4" /> : null}
                  {isVerifying ? 'Verificando...' : 'Ver mis reservas'}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setSearchPhone('')
                    setVerificationCode('')
                  }}
                >
                  Usar otro numero
                </Button>
              </form>
            ) : isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner className="h-8 w-8" />
              </div>
            ) : data?.bookings?.length === 0 ? (
              <Empty
                icon={Calendar}
                title="Sin reservas"
                description="No tienes reservas activas"
              />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">
                    Mostrando reservas para {searchPhone}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchPhone('')
                      setIsVerified(false)
                      setVerificationCode('')
                    }}
                  >
                    Cambiar numero
                  </Button>
                </div>

                {data?.bookings?.map((booking: Booking) => (
                  <div
                    key={booking.id}
                    className="rounded-lg border p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{booking.business_name}</span>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(booking.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                      </span>
                    </div>

                    {booking.notes && (
                      <p className="text-sm text-muted-foreground">
                        Notas: {booking.notes}
                      </p>
                    )}

                    {(booking.status === 'confirmed' || booking.status === 'pending') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedBooking(booking)
                          setCancelDialogOpen(true)
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancelar reserva
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar reserva</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion cancelara tu reserva en {selectedBooking?.business_name} para el {selectedBooking && formatDate(selectedBooking.date)} a las {selectedBooking && formatTime(selectedBooking.start_time)}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelBooking}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? 'Cancelando...' : 'Si, cancelar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function MyBookingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    }>
      <MyBookingsContent />
    </Suspense>
  )
}
