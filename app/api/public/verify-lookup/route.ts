import { NextRequest, NextResponse } from 'next/server'
import { verifyCode } from '@/lib/sms'

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json()

    if (!phone || !code) {
      return NextResponse.json(
        { error: 'Telefono y codigo requeridos' },
        { status: 400 }
      )
    }

    const isValid = await verifyCode(phone, code)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Codigo invalido o expirado' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Lookup] Verify error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
