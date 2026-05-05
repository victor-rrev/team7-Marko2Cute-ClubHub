// import { useState, useEffect } from 'react'
// import { useAuth } from './contexts/AuthContext'
// import { listGlobalPosts, listClubPosts, createPost } from './services/posts'
// import { listPostComments, createComment } from './services/comments'
// import './Posts.css'
//import { useState, useRef } from 'react'

// const SORT_OPTIONS = ['Public only', 'Private only', 'Both']

// function PostCard({ post }) {
//   const { user } = useAuth()
//   const [comments, setComments] = useState([])
//   const [response, setResponse] = useState('')
//   const [loading, setLoading] = useState(false)

//   const CARD_COLORS = {
//     global: '#b2e0d8',
//     club:   '#d4a5a0',
//     both:   '#b8d4f0',
//   }
//   const cardColor = CARD_COLORS[post.scope] ?? '#e8e8e8'

//   useEffect(() => {
//     listPostComments(post.id).then(setComments)
//   }, [post.id])

//   const handleReply = async () => {
//     if (!response.trim() || !user) return
//     setLoading(true)
//     try {
//       await createComment(post.id, { body: response.trim() })
//       const updated = await listPostComments(post.id)
//       setComments(updated)
//       setResponse('')
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <div className="post-card" style={{ backgroundColor: cardColor }}>
//       <div className="post-card-header">
//         <div>
//           <h3 className="post-title">{post.title ?? 'Untitled Post'}</h3>
//           <span className="post-author">Posted By: {post.authorName ?? 'Unknown'}</span>
//         </div>
//         <span className="post-scope-badge">
//           {post.scope === 'global' ? 'Public' : post.scope === 'club' ? `Private - ${post.clubName ?? 'Club'}` : 'Public & Club'}
//         </span>
//       </div>

//       <div className="post-body">
//         <p>{post.body}</p>
//       </div>

//       <div className="post-comments">
//         {comments.map(c => (
//           <p key={c.id} className="comment-line">
//             <span className="comment-author">{c.authorName ?? 'User'}:</span> {c.deletedAt ? '[deleted]' : c.body}
//           </p>
//         ))}
//       </div>

//       <div className="post-response-row">
//         <span className="response-label">Enter Response:</span>
//         <input
//           className="response-input"
//           value={response}
//           onChange={e => setResponse(e.target.value)}
//           onKeyDown={e => e.key === 'Enter' && handleReply()}
//           placeholder="Type a reply..."
//           disabled={loading || !user}
//         />
//       </div>
//     </div>
//   )
// }

// export default function Posts() {
//   const { user, userDoc } = useAuth()
//   const [posts, setPosts] = useState([])
//   const [sort, setSort] = useState('Both')
//   const [loading, setLoading] = useState(true)

//   useEffect(() => {
//     async function fetchPosts() {
//       setLoading(true)
//       try {
//         if (sort === 'Public only') {
//           const global = await listGlobalPosts({ limit: 50 })
//           setPosts(global)
//         } else if (sort === 'Private only') {
//           // Fetch posts from each club the user is in
//           const clubIds = userDoc?.clubsJoined ?? []
//           const allClubPosts = await Promise.all(
//             clubIds.map(id => listClubPosts(id, { limit: 20 }))
//           )
//           setPosts(allClubPosts.flat())
//         } else {
//           // Both
//           const [global, ...clubArrays] = await Promise.all([
//             listGlobalPosts({ limit: 50 }),
//             ...(userDoc?.clubsJoined ?? []).map(id => listClubPosts(id, { limit: 20 }))
//           ])
//           const combined = [...global, ...clubArrays.flat()]
//           // Deduplicate by id
//           const seen = new Set()
//           setPosts(combined.filter(p => seen.has(p.id) ? false : seen.add(p.id)))
//         }
//       } finally {
//         setLoading(false)
//       }
//     }
//     fetchPosts()
//   }, [sort, userDoc])

//   return (
//     <div className="posts-page">

//       {/* Sort bar */}
//       <div className="posts-sort-bar">
//         <span className="sort-label">Sort by:</span>
//         {SORT_OPTIONS.map(opt => (
//           <label key={opt} className="sort-option">
//             <input
//               type="radio"
//               name="sort"
//               checked={sort === opt}
//               onChange={() => setSort(opt)}
//             />
//             {opt}
//           </label>
//         ))}
//       </div>

//       {/* Cards grid */}
//       {loading ? (
//         <p className="posts-empty">Loading posts...</p>
//       ) : posts.length === 0 ? (
//         <p className="posts-empty">No posts to show.</p>
//       ) : (
//         <div className="posts-grid">
//           {posts.map(post => (
//             <PostCard key={post.id} post={post} />
//           ))}
//         </div>
//       )}

//       {/* Floating + button (for future create post flow) */}
//       {user && (
//         <button className="posts-add-btn" title="New post">+</button>
//       )}
//     </div>
//   )
// }


import { useState } from 'react'
import './Posts.css'

const MOCK_POSTS = [
  {
    id: '1',
    title: 'Guys where is the Black-Box Theater?',
    authorName: 'Peter Griffin',
    scope: 'global',
    clubName: null,
    comments: [
      { id: 1, authorName: 'Person A', body: "It's somewhere" },
      { id: 2, authorName: 'Person B', body: "It's near the F building" },
      { id: 3, authorName: 'Peter Griffin', body: 'Ty Person B!' },
    ],
  },
  {
    id: '2',
    title: 'Club meeting moved to new classroom',
    authorName: 'The Thinking Club',
    scope: 'club',
    clubName: 'Thinking Club',
    comments: [
      { id: 1, authorName: 'Person C', body: 'The teacher is absent and the door is locked' },
      { id: 2, authorName: 'Person D', body: 'Should we move to a different classroom?' },
      { id: 3, authorName: 'Person E', body: 'sure ill look around' },
      { id: 4, authorName: 'Person C', body: 'This classroom is open come over' },
      { id: 5, authorName: 'Person D', body: 'ok' },
    ],
  },
  {
    id: '3',
    title: 'Anyone is welcome to come to our Meetings!',
    authorName: 'The Thinking Club',
    scope: 'global',
    clubName: null,
    comments: [
      { id: 1, authorName: 'Person 1', body: 'Guys anyone is welcome to come to our meetings and think with us!' },
      { id: 2, authorName: 'Person 2', body: 'Think?' },
      { id: 3, authorName: 'Person 3', body: 'Y do we have a Thinking Club gng' },
      { id: 4, authorName: 'Person 1', body: "We're giving out free food btw" },
    ],
  },
  {
    id: '4',
    title: 'Basketball Match on Saturday',
    authorName: 'Person 4',
    scope: 'club',
    clubName: 'Basketball Team',
    comments: [
      { id: 1, authorName: 'Person 4', body: "Hey guys does anyone know who we're going against on Saturday?" },
      { id: 2, authorName: 'Person 5', body: "I think it's Torrey Pines? Maybe LCC" },
      { id: 3, authorName: 'Person 6', body: "I'm pretty sure its Torrey Pines" },
      { id: 4, authorName: 'Person 4', body: 'Okay ty guys' },
      { id: 5, authorName: 'Person 7', body: 'GL Bro' },
    ],
  },
  {
    id: '5',
    title: 'Pep Rally this Friday!',
    authorName: 'ASB',
    scope: 'global',
    clubName: null,
    comments: [
      { id: 1, authorName: 'Person 8', body: "Guys when's the Pep Rally?" },
      { id: 2, authorName: 'Person 9', body: 'DUDE THE PEP RALLY IS TOMORROW' },
      { id: 3, authorName: 'Peter Griffin', body: 'Bruh even I remembered that' },
    ],
  },
  {
    id: '6',
    title: 'Art Show submissions due Monday',
    authorName: 'Art Society',
    scope: 'club',
    clubName: 'Art Society',
    comments: [
      { id: 1, authorName: 'Person 10', body: 'Can I submit a digital piece?' },
      { id: 2, authorName: 'Art Society', body: 'Yes digital is fine!' },
      { id: 3, authorName: 'Person 11', body: 'What size should the canvas be?' },
      { id: 4, authorName: 'Art Society', body: 'Any size works' },
    ],
  },
  {
    id: '7',
    title: 'Robotics scrimmage next week',
    authorName: 'Robotics Club',
    scope: 'club',
    clubName: 'Robotics Club',
    comments: [
      { id: 1, authorName: 'Person 12', body: 'Are we ready?' },
      { id: 2, authorName: 'Person 13', body: 'Our arm mechanism still needs work' },
      { id: 3, authorName: 'Person 12', body: 'We have 5 days lets go' },
    ],
  },
  {
    id: '8',
    title: 'Lost: Blue water bottle near gym',
    authorName: 'Peter Griffin',
    scope: 'global',
    clubName: null,
    comments: [
      { id: 1, authorName: 'Person 14', body: 'I saw one by the bleachers' },
      { id: 2, authorName: 'Peter Griffin', body: 'Oh nice thanks!' },
    ],
  },
  {
    id: '9',
    title: 'Spanish Club movie night Friday',
    authorName: 'Spanish Club',
    scope: 'global',
    clubName: null,
    comments: [
      { id: 1, authorName: 'Person 15', body: 'What movie are we watching?' },
      { id: 2, authorName: 'Spanish Club', body: 'Coco!' },
      { id: 3, authorName: 'Person 16', body: 'Lets gooo' },
    ],
  },
  {
    id: '10',
    title: 'Eco Action campus cleanup Saturday',
    authorName: 'Eco Action',
    scope: 'global',
    clubName: null,
    comments: [
      { id: 1, authorName: 'Person 17', body: 'What time does it start?' },
      { id: 2, authorName: 'Eco Action', body: '9am by the main entrance' },
      { id: 3, authorName: 'Person 18', body: 'I will be there!' },
    ],
  },
]

const CARD_COLORS = {
  global: '#b2e0d8',
  club: '#d4a5a0',
  both: '#b8d4f0',
}

function PostCard({ post }) {
  const [comments, setComments] = useState(post.comments ?? [])
  const [response, setResponse] = useState('')

  const handleReply = () => {
    if (!response.trim()) return
    setComments(prev => [...prev, { id: Date.now(), authorName: 'You', body: response.trim()}])
    setResponse('')
  }

  return (
    <div className="post-card" style={{ backgroundColor: CARD_COLORS[post.scope] ?? '#e8e8e8' }}>
      <div className="post-card-header">
        <div>
          <h3 className="post-title">{post.title}</h3>
          <span className="post-author">Posted By: {post.authorName}</span>
        </div>
        <span className="post-scope-badge">
          {post.scope === 'global' ? 'Public' : `Private - ${post.clubName}`}
        </span>
      </div>

      <div className="post-comments">
        {comments.map(c => (
          <p key={c.id} className="comment-line">
            <span className="comment-author">{c.authorName}</span>{c.body}
          </p>
        ))}
      </div>

      <div className="post-response-row">
        <span className="response-label">Enter Response:</span>
        <input
          className="response-input"
          value={response}
          onChange={e => setResponse(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleReply()}
          placeholder="Type a reply..."
        />
      </div>
    </div>
  )
}

export default function Posts() {
  const [sort, setSort] = useState('Both')

  const filtered = MOCK_POSTS.filter(p => {
    if (sort === 'Public only') return p.scope === 'global'
    if (sort === 'Private only') return p.scope === 'club'
    return true
  })

  return (
    <div className="posts-page">

      <div className="posts-sort-bar">
        <span className="sort-label">Sort by:</span>
        {['Public only', 'Private only', 'Both'].map(opt => (
          <label key={opt} className="sort-option">
            <input
              type="radio"
              name="sort"
              checked={sort === opt}
              onChange={() => setSort(opt)}
            />
            {opt}
          </label>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="posts-empty">No posts to show.</p>
      ) : (
        <div className="posts-grid">
          {filtered.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      <button className="posts-add-btn" title="New post">+</button>

    </div>
  )
}