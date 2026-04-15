import { NextRequest, NextResponse } from 'next/server'
import { getBusinessById } from '@/lib/auth'
import { sendVerificationCode } from '@/lib/sms'

export async function POST(request: NextRequest) {
  try {
    const { businessId, phone } = await request.json()

    if (!businessId || !phone) {
      return NextResponse.json(
        { error: 'businessId y phone son requeridos' },
        { status: 400 }
      )
    }

    // Get business name
    const business = await getBusinessById(businessId)
    if (!business) {
      return NextResponse.json(
        { error: 'Negocio no encontrado' },
        { status: 404 }
      )
    }

    await sendVerificationCode(phone, business.name)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Verification] Request error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
