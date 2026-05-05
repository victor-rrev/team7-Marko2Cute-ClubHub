import './Sidebar.css'
import { FiCompass, FiFileText, FiCalendar, FiUser } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'

function Sidebar() {
  const { user } = useAuth()

  return (
    <div className="sidebar">
      <div className="side-bar-item">
        <Link to="/discover">
          <FiCompass size={60} />
          <span>Discover</span>
        </Link>
      </div>
      <div className="side-bar-item">
        <Link to="/posts">
          <FiFileText size={60} />
          <span>Posts</span>
        </Link>
      </div>
      <div className="side-bar-item">
        <Link to="/events">
          <FiCalendar size={60} />
          <span>Events</span>
        </Link>
      </div>
      <div className="side-bar-item">
        <Link to="/account">
          <FiUser size={60} />
          <span>Account</span>
        </Link>
      </div>

      {/* User info at bottom of sidebar */}
      {user && (
        <div className="sidebar-user">
          {user.photoURL
            ? <img src={user.photoURL} alt="avatar" className="sidebar-avatar" />
            : <FiUser size={30} />
          }
          <span className="sidebar-username">{user.displayName?.split(' ')[0]}</span>
        </div>
      )}
    </div>
  )
}

export default Sidebar