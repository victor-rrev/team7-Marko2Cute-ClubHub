import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import SignInScreen from './components/SignInScreen'
import Onboarding from './components/Onboarding'
import Sidebar from './components/Sidebar'
import Discover from './pages/Discover'
import CreateClub from './pages/CreateClub'
import ClubDetail from './pages/ClubDetail'
import EditClub from './pages/EditClub'
import Posts from './pages/Posts'
import PostDetail from './pages/PostDetail'
import MyClubs from './pages/MyClubs'
import Events from './pages/Events'
import EditEvent from './pages/EditEvent'
import Account from './pages/Account'

function AppShell() {
  const { user, loading, isOnboarded } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    )
  }

  if (!user) return <SignInScreen />
  if (!isOnboarded) return <Onboarding />

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="md:ml-56 pb-20 md:pb-0">
        <Routes>
          <Route path="/" element={<Posts />} />
          <Route path="/posts" element={<Posts />} />
          <Route path="/posts/:postId" element={<PostDetail />} />
          <Route path="/my-clubs" element={<MyClubs />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/clubs/new" element={<CreateClub />} />
          <Route path="/clubs/:clubId" element={<ClubDetail />} />
          <Route path="/clubs/:clubId/edit" element={<EditClub />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:eventId/edit" element={<EditEvent />} />
          <Route path="/account" element={<Account />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}
