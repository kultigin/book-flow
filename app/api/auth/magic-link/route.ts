import { NextRequest, NextResponse } from 'next/server'
import { createMagicLinkToken, getBusinessById } from '@/lib/auth'
import { sendMagicLinkEmail } from '@/lib/email'
import { sql } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email es requerido' },
        { status: 400 }
      )
    }

    const token = await createMagicLinkToken(email)

    if (!token) {
      // Don't reveal if email exists or not
      return NextResponse.json({ success: true })
    }

    // Get business name for the email
    const accountHolder = await sql`
      SELECT business_id FROM account_holders WHERE email = ${email}
    `
    
    let businessName = 'Sistema de Reservas'
    if (accountHolder.length > 0) {
      const business = await getBusinessById(accountHolder[0].business_id)
      if (business) {
        businessName = business.name
      }
    }

    await sendMagicLinkEmail(email, token, businessName)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Auth] Magic link error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
