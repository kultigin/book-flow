'use client'

import { useRef, useState } from 'react'
import { Camera, Check, Loader2, Pencil, X } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface ProfileFormProps {
  accountHolderId: string
  name: string
  currentSlug: string | null
  hasAvatar: boolean
  host: string
  protocol: string
}

export function ProfileForm({ accountHolderId, name, currentSlug, hasAvatar, host, protocol }: ProfileFormProps) {
  const [slug, setSlug] = useState(currentSlug ?? '')
  const [editingSlug, setEditingSlug] = useState(false)
  const [savingSlug, setSavingSlug] = useState(false)

  const [avatarCacheBuster, setAvatarCacheBuster] = useState(() => hasAvatar ? Date.now() : 0)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarUrl = avatarCacheBuster ? `/api/public/avatar/${accountHolderId}?t=${avatarCacheBuster}` : null
  const fileInputRef = useRef<HTMLInputElement>(null)

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  async function saveSlug() {
    setSavingSlug(true)
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Error al guardar el slug')
        return
      }
      setSlug(data.slug)
      setEditingSlug(false)
      toast.success('Enlace actualizado')
    } finally {
      setSavingSlug(false)
    }
  }

  function cancelSlugEdit() {
    setSlug(currentSlug ?? '')
    setEditingSlug(false)
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingAvatar(true)
    try {
      const fd = new FormData()
      fd.append('avatar', file)
      const res = await fetch('/api/account/avatar', { method: 'POST', body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || 'Error al subir la imagen')
        return
      }
      setAvatarCacheBuster(Date.now())
      toast.success('Foto de perfil actualizada')
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const bookingUrl = slug ? `${protocol}://${host}/book/${slug}` : null

  return (
    <div className="space-y-6">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-3 py-2">
        <div className="relative">
          <Avatar className="h-24 w-24">
            <AvatarImage src={avatarUrl ?? undefined} alt={name} />
            <AvatarFallback className="text-2xl bg-primary/10 text-primary">{initials}</AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {uploadingAvatar ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
        <p className="text-xs text-muted-foreground">Haz clic en la cámara para cambiar tu foto</p>
      </div>

      {/* Slug */}
      <div className="space-y-2">
        <Label>Enlace de reservas</Label>
        {editingSlug ? (
          <div className="flex items-center gap-2">
            <div className="flex flex-1 items-center rounded-md border bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground">
              {protocol}://{host}/book/
            </div>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
              placeholder="tu-enlace"
              className="w-36"
              autoFocus
            />
            <Button size="icon" variant="ghost" onClick={saveSlug} disabled={savingSlug}>
              {savingSlug ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-green-600" />}
            </Button>
            <Button size="icon" variant="ghost" onClick={cancelSlugEdit} disabled={savingSlug}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {bookingUrl ? (
              <a
                href={bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-md border px-3 py-2 text-sm font-mono text-primary hover:bg-primary/5 transition-colors break-all"
              >
                {bookingUrl}
              </a>
            ) : (
              <span className="flex-1 rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
                Sin enlace configurado
              </span>
            )}
            <Button size="icon" variant="ghost" onClick={() => setEditingSlug(true)}>
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
