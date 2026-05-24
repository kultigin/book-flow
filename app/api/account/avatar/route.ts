import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { sql } from '@/lib/db'
import { put } from '@vercel/blob'

export async function POST(req: NextRequest) {
  const { accountHolder } = await requireAuth()

  const formData = await req.formData()
  const file = formData.get('avatar') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Solo se permiten imágenes' }, { status: 400 })
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'La imagen no puede superar 5 MB' }, { status: 400 })
  }

  try {
    const ext = file.name.split('.').pop() || 'jpg'
    const blob = await put(`avatars/${accountHolder.id}.${ext}`, file, {
      access: 'private',
      allowOverwrite: true,
    })

    await sql`
      UPDATE account_holders SET avatar_url = ${blob.url} WHERE id = ${accountHolder.id}
    `

    return NextResponse.json({ url: blob.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al subir la imagen'
    console.error('[avatar upload]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
