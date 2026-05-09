import { useEffect, useState } from 'react'
import { FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi'
import { useStorageURL } from '../hooks/useStorageURL'

export default function Lightbox({ paths, initialIndex = 0, onClose }) {
  const [index, setIndex] = useState(initialIndex)
  const url = useStorageURL(paths[index])

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1))
      else if (e.key === 'ArrowRight')
        setIndex((i) => Math.min(paths.length - 1, i + 1))
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [paths.length, onClose])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const goPrev = (e) => {
    e.stopPropagation()
    setIndex((i) => Math.max(0, i - 1))
  }
  const goNext = (e) => {
    e.stopPropagation()
    setIndex((i) => Math.min(paths.length - 1, i + 1))
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        className="absolute top-4 right-4 size-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
        aria-label="Close"
      >
        <FiX className="size-5" />
      </button>

      {paths.length > 1 && (
        <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/10 text-white text-sm font-medium">
          {index + 1} / {paths.length}
        </span>
      )}

      {paths.length > 1 && index > 0 && (
        <button
          type="button"
          onClick={goPrev}
          className="absolute left-4 size-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          aria-label="Previous"
        >
          <FiChevronLeft className="size-6" />
        </button>
      )}

      {paths.length > 1 && index < paths.length - 1 && (
        <button
          type="button"
          onClick={goNext}
          className="absolute right-4 size-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          aria-label="Next"
        >
          <FiChevronRight className="size-6" />
        </button>
      )}

      <div
        onClick={(e) => e.stopPropagation()}
        className="max-w-[90vw] max-h-[90vh] flex items-center justify-center"
      >
        {url ? (
          <img
            src={url}
            alt=""
            className="max-w-[90vw] max-h-[90vh] object-contain"
          />
        ) : (
          <div className="size-32 bg-white/10 rounded animate-pulse" />
        )}
      </div>
    </div>
  )
}
