import { useState } from 'react'
import { FiX } from 'react-icons/fi'
import { useStorageURL } from '../hooks/useStorageURL'
import Lightbox from './Lightbox'

export default function PostMedia({ mediaPaths }) {
  const [lightboxIndex, setLightboxIndex] = useState(null)
  if (!mediaPaths || mediaPaths.length === 0) return null

  const openAt = (idx) => setLightboxIndex(idx)
  const close = () => setLightboxIndex(null)

  let content
  if (mediaPaths.length === 1) {
    content = (
      <div className="mt-3 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-950">
        <button
          type="button"
          onClick={() => openAt(0)}
          className="block w-full cursor-zoom-in"
        >
          <MediaImage path={mediaPaths[0]} variant="single" />
        </button>
      </div>
    )
  } else {
    const colsClass = mediaPaths.length === 3 ? 'grid-cols-3' : 'grid-cols-2'
    content = (
      <div className={`mt-3 grid gap-1 ${colsClass}`}>
        {mediaPaths.map((path, i) => (
          <button
            type="button"
            key={path}
            onClick={() => openAt(i)}
            className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-zoom-in"
          >
            <MediaImage path={path} variant="grid" />
          </button>
        ))}
      </div>
    )
  }

  return (
    <>
      {content}
      {lightboxIndex !== null && (
        <Lightbox
          paths={mediaPaths}
          initialIndex={lightboxIndex}
          onClose={close}
        />
      )}
    </>
  )
}

export function EditableMediaGrid({ mediaPaths, onRemove }) {
  if (!mediaPaths || mediaPaths.length === 0) return null
  return (
    <div className="grid grid-cols-2 gap-1">
      {mediaPaths.map((path, i) => (
        <div
          key={path}
          className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800"
        >
          <MediaImage path={path} variant="grid" />
          <button
            type="button"
            onClick={() => onRemove(i)}
            className="absolute top-1 right-1 size-5 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
            aria-label="Remove image"
          >
            <FiX className="size-3" />
          </button>
        </div>
      ))}
    </div>
  )
}

function MediaImage({ path, variant }) {
  const url = useStorageURL(path)
  if (!url) {
    return (
      <div
        className={`${variant === 'single' ? 'h-64' : 'size-full'} bg-gray-100 dark:bg-gray-800 animate-pulse`}
      />
    )
  }
  if (variant === 'single') {
    return (
      <img src={url} alt="" className="w-full max-h-96 object-contain mx-auto" />
    )
  }
  return <img src={url} alt="" className="size-full object-cover" />
}
