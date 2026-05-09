import { useEffect, useState } from 'react'
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { FiArrowLeft, FiEdit2, FiLock, FiUsers } from 'react-icons/fi'
import { getClub } from '../services/clubs'
import {
  approveMember,
  getMyMembership,
  joinClub,
  kickMember,
  leaveClub,
  listClubMembers,
  listPendingRequests,
  setMemberRole,
} from '../services/memberships'
import { listClubPosts } from '../services/posts'
import { listClubEvents } from '../services/events'
import { getUser } from '../services/users'
import { useAuth } from '../contexts/AuthContext'
import PostCard from '../components/PostCard'
import EventCard from '../components/EventCard'
import CreatePostBox from '../components/CreatePostBox'
import CreateEventForm from '../components/CreateEventForm'
import ClubLogo from '../components/ClubLogo'
import ChatTab from '../components/ChatTab'
import { categoryChipClass } from '../lib/categoryColors'

export default function ClubDetail() {
  const { clubId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const from = location.state?.from
  const backTo = from?.startsWith('/discover')
    ? { path: '/discover', label: 'Back to discover' }
    : from?.startsWith('/posts')
      ? { path: '/posts', label: 'Back to posts' }
      : from?.startsWith('/account')
        ? { path: '/account', label: 'Back to account' }
        : null

  const [club, setClub] = useState(null)
  const [membership, setMembership] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionPending, setActionPending] = useState(false)

  const [tab, setTab] = useState('posts')
  const [posts, setPosts] = useState([])
  const [events, setEvents] = useState([])
  const [members, setMembers] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [showEventForm, setShowEventForm] = useState(false)
  const [tabRefresh, setTabRefresh] = useState(0)

  const isMember = membership?.status === 'active'
  const isAdmin =
    isMember && (membership.role === 'admin' || membership.role === 'owner')
  const isOwner = isMember && membership.role === 'owner'
  const refreshTab = () => setTabRefresh((n) => n + 1)
  const tabs = isMember
    ? ['posts', 'chat', 'events', 'members']
    : ['posts', 'events', 'members']

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const [c, m] = await Promise.all([
          getClub(clubId),
          getMyMembership(clubId),
        ])
        if (cancelled) return
        if (!c) {
          toast.error('Club not found.')
          navigate('/discover')
          return
        }
        setClub(c)
        setMembership(m)
      } catch (err) {
        console.error(
          '[club-detail] load failed:',
          err.code || err.name,
          '—',
          err.message,
        )
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [clubId, navigate])

  useEffect(() => {
    let cancelled = false

    async function loadTab() {
      try {
        if (tab === 'posts') {
          const result = await listClubPosts(clubId, { limit: 50 })
          if (!cancelled) setPosts(result)
        } else if (tab === 'events') {
          const result = await listClubEvents(clubId, { upcomingOnly: true })
          if (!cancelled) setEvents(result)
        } else if (tab === 'members') {
          const result = await listClubMembers(clubId)
          if (!cancelled) setMembers(result)
          if (isAdmin) {
            const pending = await listPendingRequests(clubId)
            if (!cancelled) setPendingRequests(pending)
          } else if (!cancelled) {
            setPendingRequests([])
          }
        }
      } catch (err) {
        console.error(
          `[club-detail] load ${tab} failed:`,
          err.code || err.name,
          '—',
          err.message,
        )
      }
    }

    loadTab()
    return () => {
      cancelled = true
    }
  }, [tab, clubId, tabRefresh, isAdmin])

  const handleJoin = async () => {
    setActionPending(true)
    try {
      await joinClub(clubId)
      const m = await getMyMembership(clubId)
      setMembership(m)
      toast.success(m?.status === 'active' ? 'Joined!' : 'Request sent.')
    } catch (err) {
      console.error(
        '[club-detail] join failed:',
        err.code || err.name,
        '—',
        err.message,
      )
      toast.error("Couldn't join.")
    } finally {
      setActionPending(false)
    }
  }

  const handleLeave = async () => {
    if (!window.confirm(`Leave ${club.name}?`)) return
    setActionPending(true)
    try {
      await leaveClub(clubId)
      setMembership(null)
      toast.success('Left club.')
    } catch (err) {
      console.error(
        '[club-detail] leave failed:',
        err.code || err.name,
        '—',
        err.message,
      )
      toast.error("Couldn't leave.")
    } finally {
      setActionPending(false)
    }
  }

  if (loading || !club) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {backTo && (
        <Link
          to={backTo.path}
          className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
        >
          <FiArrowLeft className="size-4" />
          {backTo.label}
        </Link>
      )}

      {/* Header card */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 mb-6">
        <div className="flex items-start gap-4">
          <ClubLogo
            club={club}
            size="lg"
            editable={isAdmin}
            onUpdated={(patch) => setClub((prev) => ({ ...prev, ...patch }))}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {club.name}
              </h1>
              {club.joinPolicy === 'approval' && (
                <FiLock
                  className="size-4 text-gray-400 shrink-0 mt-1.5"
                  title="Approval required"
                />
              )}
            </div>
            <div className="mt-1 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="inline-flex items-center gap-1">
                <FiUsers className="size-3.5" />
                {club.memberCount ?? 0}{' '}
                {club.memberCount === 1 ? 'member' : 'members'}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {club.categories?.map((cat) => (
                <span
                  key={cat}
                  className={`px-2 py-0.5 rounded-full text-xs ${categoryChipClass(cat)}`}
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>
          <div className="shrink-0">
            <JoinButton
              membership={membership}
              joinPolicy={club.joinPolicy}
              actionPending={actionPending}
              onJoin={handleJoin}
              onLeave={handleLeave}
            />
          </div>
        </div>
        {club.description && (
          <p className="mt-4 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {club.description}
          </p>
        )}
        {isAdmin && (
          <Link
            to={`/clubs/${clubId}/edit`}
            className="mt-4 inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <FiEdit2 className="size-3.5" />
            Edit club
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800 mb-4 flex gap-1">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors -mb-px border-b-2 ${
              tab === t
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'posts' && (
        <div className="space-y-3">
          {isMember && (
            <CreatePostBox
              clubId={clubId}
              isAdmin={isAdmin}
              onCreated={refreshTab}
            />
          )}
          {posts.length === 0 ? (
            <EmptyTab text="No posts yet." />
          ) : (
            posts.map((p) => <PostCard key={p.id} post={p} />)
          )}
        </div>
      )}

      {tab === 'chat' && isMember && <ChatTab clubId={clubId} />}

      {tab === 'events' && (
        <div className="space-y-3">
          {isAdmin &&
            (showEventForm ? (
              <CreateEventForm
                clubId={clubId}
                onCreated={() => {
                  setShowEventForm(false)
                  refreshTab()
                }}
                onCancel={() => setShowEventForm(false)}
              />
            ) : (
              <button
                onClick={() => setShowEventForm(true)}
                className="w-full px-4 py-2 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:border-orange-500 hover:text-orange-500 transition-colors"
              >
                + Create event
              </button>
            ))}
          {events.length === 0 ? (
            <EmptyTab text="No upcoming events." />
          ) : (
            events.map((e) => (
              <EventCard key={e.id} event={e} canEdit={isAdmin} />
            ))
          )}
        </div>
      )}

      {tab === 'members' && (
        <div className="space-y-4">
          {isAdmin && pendingRequests.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Pending requests ({pendingRequests.length})
              </h3>
              <ul className="space-y-2">
                {pendingRequests.map((m) => (
                  <PendingRow
                    key={m.id}
                    membership={m}
                    clubId={clubId}
                    onActioned={refreshTab}
                  />
                ))}
              </ul>
            </div>
          )}
          {members.length === 0 ? (
            <EmptyTab text="No members yet." />
          ) : (
            <div>
              {isAdmin && pendingRequests.length > 0 && (
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Members ({members.length})
                </h3>
              )}
              <ul className="space-y-2">
                {members.map((m) => (
                  <MemberRow
                    key={m.id}
                    membership={m}
                    clubId={clubId}
                    isAdmin={isAdmin}
                    isOwner={isOwner}
                    currentUserId={user.uid}
                    onActioned={refreshTab}
                  />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function JoinButton({ membership, joinPolicy, actionPending, onJoin, onLeave }) {
  if (!membership) {
    return (
      <button
        onClick={onJoin}
        disabled={actionPending}
        className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-medium transition-colors"
      >
        {actionPending
          ? '...'
          : joinPolicy === 'approval'
            ? 'Request to join'
            : 'Join'}
      </button>
    )
  }
  if (membership.status === 'pending') {
    return (
      <span className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm font-medium">
        Pending
      </span>
    )
  }
  if (membership.role === 'owner') {
    return (
      <span className="px-4 py-2 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-sm font-medium">
        Owner
      </span>
    )
  }
  return (
    <button
      onClick={onLeave}
      disabled={actionPending}
      className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-60 text-gray-700 dark:text-gray-300 text-sm font-medium transition-colors"
    >
      {actionPending ? '...' : 'Leave'}
    </button>
  )
}

function EmptyTab({ text }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center">
      <p className="text-gray-600 dark:text-gray-400">{text}</p>
    </div>
  )
}

function MemberRow({
  membership,
  clubId,
  isAdmin,
  isOwner,
  currentUserId,
  onActioned,
}) {
  const [memberUser, setMemberUser] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    getUser(membership.userId).then((u) => {
      if (!cancelled) setMemberUser(u)
    })
    return () => {
      cancelled = true
    }
  }, [membership.userId])

  const displayName = membership.nickname || memberUser?.displayName || 'User'
  const isSelf = membership.userId === currentUserId
  const isThisOwner = membership.role === 'owner'
  const canKick = isAdmin && !isSelf && !isThisOwner
  const canChangeRole = isOwner && !isSelf && !isThisOwner

  const handleKick = async () => {
    if (!window.confirm(`Kick ${displayName} from the club?`)) return
    setBusy(true)
    try {
      await kickMember(membership.userId, clubId)
      toast.success('Member removed.')
      onActioned?.()
    } catch (err) {
      console.error(
        '[member-row] kick failed:',
        err.code || err.name,
        '—',
        err.message,
      )
      toast.error("Couldn't remove member.")
      setBusy(false)
    }
  }

  const handleRoleChange = async (e) => {
    const newRole = e.target.value
    if (newRole === membership.role) return
    const confirmMsg =
      newRole === 'owner'
        ? `Transfer ownership to ${displayName}? You'll be demoted to admin.`
        : `Make ${displayName} ${newRole === 'admin' ? 'an admin' : 'a member'}?`
    if (!window.confirm(confirmMsg)) {
      e.target.value = membership.role
      return
    }
    setBusy(true)
    try {
      await setMemberRole(membership.userId, clubId, newRole)
      toast.success('Role updated.')
      onActioned?.()
    } catch (err) {
      console.error(
        '[member-row] role change failed:',
        err.code || err.name,
        '—',
        err.message,
      )
      toast.error("Couldn't update role.")
      setBusy(false)
    }
  }

  return (
    <li className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
      {memberUser?.photoURL ? (
        <img
          src={memberUser.photoURL}
          alt=""
          className="size-8 rounded-full object-cover"
        />
      ) : (
        <div className="size-8 rounded-full bg-gray-300 dark:bg-gray-700" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {displayName}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
          {membership.role}
        </p>
      </div>
      {canChangeRole && (
        <select
          value={membership.role}
          onChange={handleRoleChange}
          disabled={busy}
          className="text-xs rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-700 dark:text-gray-300 px-2 py-1"
        >
          <option value="member">Member</option>
          <option value="admin">Admin</option>
          <option value="owner">Transfer ownership</option>
        </select>
      )}
      {canKick && (
        <button
          onClick={handleKick}
          disabled={busy}
          className="text-xs px-2 py-1 rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-60 transition-colors"
        >
          Kick
        </button>
      )}
    </li>
  )
}

function PendingRow({ membership, clubId, onActioned }) {
  const [memberUser, setMemberUser] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    getUser(membership.userId).then((u) => {
      if (!cancelled) setMemberUser(u)
    })
    return () => {
      cancelled = true
    }
  }, [membership.userId])

  const displayName = memberUser?.displayName || 'User'

  const handleApprove = async () => {
    setBusy(true)
    try {
      await approveMember(membership.userId, clubId)
      toast.success('Request approved.')
      onActioned?.()
    } catch (err) {
      console.error(
        '[pending-row] approve failed:',
        err.code || err.name,
        '—',
        err.message,
      )
      toast.error("Couldn't approve.")
      setBusy(false)
    }
  }

  const handleReject = async () => {
    if (!window.confirm(`Reject ${displayName}?`)) return
    setBusy(true)
    try {
      await kickMember(membership.userId, clubId)
      toast.success('Request rejected.')
      onActioned?.()
    } catch (err) {
      console.error(
        '[pending-row] reject failed:',
        err.code || err.name,
        '—',
        err.message,
      )
      toast.error("Couldn't reject.")
      setBusy(false)
    }
  }

  return (
    <li className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-900 border border-orange-300 dark:border-orange-700">
      {memberUser?.photoURL ? (
        <img
          src={memberUser.photoURL}
          alt=""
          className="size-8 rounded-full object-cover"
        />
      ) : (
        <div className="size-8 rounded-full bg-gray-300 dark:bg-gray-700" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {displayName}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Wants to join</p>
      </div>
      <button
        onClick={handleApprove}
        disabled={busy}
        className="px-3 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-xs font-medium transition-colors"
      >
        Approve
      </button>
      <button
        onClick={handleReject}
        disabled={busy}
        className="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-60 text-gray-700 dark:text-gray-300 text-xs font-medium transition-colors"
      >
        Reject
      </button>
    </li>
  )
}
