import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { uploadClubLogo } from '../services/storage'
import { updateClub } from '../services/clubs'
import { useStorageURL } from '../hooks/useStorageURL'
import { categoryChipClass } from '../lib/categoryColors'

const SIZES = {
  sm: { box: 'size-12 rounded-lg', text: 'text-lg' },
  md: { box: 'size-14 rounded-xl', text: 'text-xl' },
  lg: { box: 'size-16 rounded-xl', text: 'text-2xl' },
}

export default function ClubLogo({
  club,
  size = 'md',
  editable = false,
  onUpdated,
}) {
  const logoURL = useStorageURL(club.logoPath)
  const fileRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const s = SIZES[size] ?? SIZES.md
  const placeholderColor = club.categories?.[0]
    ? categoryChipClass(club.categories[0])
    : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { path } = await uploadClubLogo(club.id, file)
      await updateClub(club.id, { logoPath: path })
      toast.success('Logo updated.')
      onUpdated?.({ logoPath: path })
    } catch (err) {
      console.error(
        '[club-logo] upload failed:',
        err.code || err.name,
        '—',
        err.message,
      )
      toast.error("Couldn't upload logo.")
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div
      className={`relative ${s.box} ${placeholderColor} overflow-hidden shrink-0 group`}
    >
      {logoURL ? (
        <img src={logoURL} alt="" className="size-full object-cover" />
      ) : (
        <div
          className={`size-full flex items-center justify-center ${s.text} font-bold`}
        >
          {club.name?.[0]?.toUpperCase() ?? '?'}
        </div>
      )}
      {editable && (
        <>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-medium transition-opacity disabled:opacity-50"
          >
            {uploading ? '...' : 'Change'}
          </button>
          <input
            type="file"
            accept="image/*"
            ref={fileRef}
            onChange={handleFileChange}
            className="hidden"
          />
        </>
      )}
    </div>
  )
}
