import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { generateVerificationCode, sendSms } from '@/lib/sms'

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json(
        { error: 'Telefono requerido' },
        { status: 400 }
      )
    }

    const code = generateVerificationCode()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Delete any existing codes for this phone
    await sql`DELETE FROM verification_codes WHERE phone = ${phone}`

    // Store the new code
    await sql`
      INSERT INTO verification_codes (phone, code, expires_at)
      VALUES (${phone}, ${code}, ${expiresAt.toISOString()})
    `

    await sendSms({
      to: phone,
      message: `Tu codigo para ver tus reservas es: ${code}. Valido por 10 minutos.`,
      type: 'verification'
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Lookup] Send code error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
