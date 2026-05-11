import { useEffect, useState } from 'react'
import { getDownloadURL, ref } from 'firebase/storage'
import { storage } from '../lib/firebase'

/**
 * Resolves a Storage path (e.g. `clubs/abc/logo.png`) to a public download
 * URL. Returns `null` while loading or if path is empty/missing. Re-fetches
 * when the path changes.
 */
export function useStorageURL(path) {
  const [url, setUrl] = useState(null)

  useEffect(() => {
    if (!path) {
      setUrl(null)
      return
    }
    let cancelled = false
    getDownloadURL(ref(storage, path))
      .then((resolved) => {
        if (!cancelled) setUrl(resolved)
      })
      .catch(() => {
        if (!cancelled) setUrl(null)
      })
    return () => {
      cancelled = true
    }
  }, [path])

  return url
}
