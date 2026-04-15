import { NextRequest, NextResponse } from 'next/server'
import { verifyMagicLinkToken, createSession } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Token es requerido' },
        { status: 400 }
      )
    }

    const email = await verifyMagicLinkToken(token)

    if (!email) {
      return NextResponse.json(
        { error: 'Enlace invalido o expirado' },
        { status: 401 }
      )
    }

    // Get the account holder by email
    const result = await sql`
      SELECT id FROM account_holders WHERE email = ${email} AND is_active = true
    `

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Cuenta no encontrada' },
        { status: 401 }
      )
    }

    await createSession(result[0].id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Auth] Verify magic link error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
