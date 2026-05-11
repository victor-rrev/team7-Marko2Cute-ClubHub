import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  addPostReaction,
  listPostReactions,
  removePostReaction,
} from '../services/reactions'
import { REACTIONS } from '../lib/constants'
import { useAuth } from '../contexts/AuthContext'

export default function ReactionBar({ postId }) {
  const { user } = useAuth()
  const [reactions, setReactions] = useState([])
  const [pending, setPending] = useState(null)

  useEffect(() => {
    let cancelled = false
    listPostReactions(postId)
      .then((result) => {
        if (!cancelled) setReactions(result)
      })
      .catch((err) => {
        console.error(
          '[reactions] list failed:',
          err.code || err.name,
          '—',
          err.message,
        )
      })
    return () => {
      cancelled = true
    }
  }, [postId])

  const aggregated = useMemo(() => {
    const map = new Map()
    REACTIONS.forEach((emoji) => map.set(emoji, { count: 0, mine: false }))
    reactions.forEach((r) => {
      const current = map.get(r.emoji) ?? { count: 0, mine: false }
      current.count += 1
      if (user && r.userId === user.uid) current.mine = true
      map.set(r.emoji, current)
    })
    return Array.from(map.entries())
  }, [reactions, user])

  const toggle = async (emoji) => {
    if (!user || pending) return
    setPending(emoji)
    const current = aggregated.find(([e]) => e === emoji)?.[1]
    try {
      if (current?.mine) {
        await removePostReaction(postId, emoji)
        setReactions((prev) =>
          prev.filter((r) => !(r.userId === user.uid && r.emoji === emoji)),
        )
      } else {
        await addPostReaction(postId, emoji)
        setReactions((prev) => [
          ...prev,
          { userId: user.uid, emoji, createdAt: new Date() },
        ])
      }
    } catch (err) {
      console.error(
        '[reactions] toggle failed:',
        err.code || err.name,
        '—',
        err.message,
      )
      toast.error("Couldn't react.")
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="flex flex-wrap gap-1">
      {aggregated.map(([emoji, { count, mine }]) => (
        <button
          key={emoji}
          onClick={() => toggle(emoji)}
          disabled={pending === emoji}
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border transition-colors ${
            mine
              ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-600'
          } disabled:opacity-60`}
        >
          <span className="text-sm">{emoji}</span>
          <span>{count}</span>
        </button>
      ))}
    </div>
  )
}
