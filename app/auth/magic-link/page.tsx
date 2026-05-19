'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function MagicLinkPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setError('Token no valido')
      return
    }

    async function verifyToken() {
      try {
        const res = await fetch('/api/auth/verify-magic-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        })

        const data = await res.json()

        if (!res.ok) {
          setStatus('error')
          setError(data.error || 'Error al verificar el enlace')
          return
        }

        setStatus('success')
        setTimeout(() => {
          router.push('/dashboard')
          router.refresh()
        }, 1500)
      } catch {
        setStatus('error')
        setError('Error de conexion')
      }
    }

    verifyToken()
  }, [token, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Verificando enlace</CardTitle>
          <CardDescription>
            Estamos verificando tu enlace de acceso
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center py-8">
          {status === 'loading' && (
            <>
              <Spinner className="h-12 w-12 mb-4" />
              <p className="text-muted-foreground">Verificando...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <p className="font-medium">Acceso verificado</p>
              <p className="text-muted-foreground text-sm">Redirigiendo al panel...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 text-destructive mb-4" />
              <p className="font-medium mb-2">Error de verificacion</p>
              <p className="text-muted-foreground text-sm mb-4">{error}</p>
              <Button asChild>
                <Link href="/login">Volver al inicio de sesion</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
