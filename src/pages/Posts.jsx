import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listGlobalPosts } from '../services/posts'
import PostCard from '../components/PostCard'

export default function Posts() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    listGlobalPosts({ limit: 50 })
      .then((result) => {
        if (!cancelled) setPosts(result)
      })
      .catch((err) => {
        console.error(
          '[posts] listGlobalPosts failed:',
          err.code || err.name,
          '—',
          err.message,
        )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Posts</h1>

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">No global posts yet.</p>
          <Link
            to="/discover"
            className="inline-flex items-center mt-4 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors"
          >
            Browse clubs
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
