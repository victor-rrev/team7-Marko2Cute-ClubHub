import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useAuth } from '../contexts/AuthContext'
import { sendMessage, subscribeToMessages } from '../services/messages'
import { getUser } from '../services/users'

dayjs.extend(relativeTime)

export default function ChatTab({ clubId }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    const unsub = subscribeToMessages(
      clubId,
      (msgs) => {
        // newest-first off the wire; reverse for top-down chronological
        setMessages(msgs.slice().reverse())
      },
      (err) => {
        console.error(
          '[chat] subscription error:',
          err.code || err.name,
          '—',
          err.message,
        )
      },
    )
    return unsub
  }, [clubId])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = body.trim()
    if (!trimmed) return
    if (trimmed.length > 500) {
      toast.error('Max 500 characters.')
      return
    }
    setSending(true)
    try {
      await sendMessage(clubId, trimmed)
      setBody('')
    } catch (err) {
      console.error(
        '[chat] send failed:',
        err.code || err.name,
        '—',
        err.message,
      )
      toast.error("Couldn't send.")
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col h-[60vh]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-8">
            No messages yet. Say hi!
          </p>
        ) : (
          messages.map((msg) => (
            <MessageRow
              key={msg.id}
              message={msg}
              isSelf={msg.authorId === user.uid}
            />
          ))
        )}
      </div>
      <form
        onSubmit={handleSubmit}
        className="border-t border-gray-200 dark:border-gray-800 p-3"
      >
        <div className="flex gap-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={500}
            rows={1}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none text-sm"
          />
          <button
            type="submit"
            disabled={sending || !body.trim()}
            className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}

function MessageRow({ message, isSelf }) {
  const [author, setAuthor] = useState(null)

  useEffect(() => {
    let cancelled = false
    getUser(message.authorId).then((u) => {
      if (!cancelled) setAuthor(u)
    })
    return () => {
      cancelled = true
    }
  }, [message.authorId])

  const createdDate = message.createdAt?.toDate?.() ?? message.createdAt

  return (
    <div className={`flex gap-3 ${isSelf ? 'flex-row-reverse' : ''}`}>
      {author?.photoURL ? (
        <img
          src={author.photoURL}
          alt=""
          className="size-7 rounded-full shrink-0 object-cover mt-5"
        />
      ) : (
        <div className="size-7 rounded-full bg-gray-300 dark:bg-gray-700 shrink-0 mt-5" />
      )}
      <div
        className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} max-w-[75%] min-w-0`}
      >
        <span className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-1 px-1">
          {author?.displayName ?? '...'}
        </span>
        <div
          className={`px-4 py-2.5 rounded-2xl text-base leading-snug whitespace-pre-wrap break-words ${
            isSelf
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
          }`}
        >
          {message.body}
        </div>
        {createdDate && (
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-1">
            {dayjs(createdDate).fromNow()}
          </span>
        )}
      </div>
    </div>
  )
}
