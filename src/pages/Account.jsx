import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { useAuth } from '../contexts/AuthContext'
import { db } from '../lib/firebase'
import { listUserMemberships } from '../services/memberships'
import { getClub } from '../services/clubs'
import { uploadAvatar } from '../services/storage'
import ClubCard from '../components/ClubCard'

export default function Account() {
  const { user, userDoc, signOut } = useAuth()
  const [clubs, setClubs] = useState([])
  const [loadingClubs, setLoadingClubs] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoadingClubs(true)
      try {
        const memberships = await listUserMemberships(user.uid)
        const clubsResolved = await Promise.all(
          memberships.map((m) => getClub(m.clubId).catch(() => null)),
        )
        if (!cancelled) setClubs(clubsResolved.filter(Boolean))
      } catch (err) {
        console.error(
          '[account] load memberships failed:',
          err.code || err.name,
          '—',
          err.message,
        )
      } finally {
        if (!cancelled) setLoadingClubs(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [user.uid])

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { url } = await uploadAvatar(file)
      await updateDoc(doc(db, 'users', user.uid), {
        photoURL: url,
        updatedAt: serverTimestamp(),
      })
      toast.success('Avatar updated.')
    } catch (err) {
      console.error(
        '[account] avatar upload failed:',
        err.code || err.name,
        '—',
        err.message,
      )
      toast.error("Couldn't upload avatar.")
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const photoURL = userDoc?.photoURL || user?.photoURL

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 sm:px-6 sm:py-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Account</h1>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5 flex items-center gap-4">
        <div className="relative size-14 shrink-0 group">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="size-14 rounded-full overflow-hidden block disabled:opacity-50"
            aria-label="Change avatar"
          >
            {photoURL ? (
              <img src={photoURL} alt="" className="size-full object-cover" />
            ) : (
              <div className="size-full bg-gray-300 dark:bg-gray-700" />
            )}
            <span className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-medium transition-opacity">
              {uploading ? '...' : 'Change'}
            </span>
          </button>
          <span className="absolute -bottom-0.5 -right-0.5 size-5 rounded-full bg-orange-500 border-2 border-white dark:border-gray-900 flex items-center justify-center text-white text-[10px] pointer-events-none md:hidden">
            +
          </span>
          <input
            type="file"
            accept="image/*"
            ref={fileRef}
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            {user?.displayName || 'You'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
          {userDoc?.gradeLevel && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {userDoc.gradeLevel[0].toUpperCase() + userDoc.gradeLevel.slice(1)} ·{' '}
              {userDoc.pronouns}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">My clubs</h2>
        {loadingClubs ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        ) : clubs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">No clubs yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {clubs.map((club) => (
              <ClubCard key={club.id} club={club} />
            ))}
          </div>
        )}
      </div>

      <button
        onClick={signOut}
        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
      >
        Sign out
      </button>
    </div>
  )
}
