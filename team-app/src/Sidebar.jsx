import './Sidebar.css';
import { FiCompass, FiFileText, FiCalendar, FiUser } from 'react-icons/fi';

function Sidebar({setPage}){
    return (
        <div className = "sidebar">
            <div className = "side-bar-item" onClick={() => setPage('discover')}>
                <FiCompass size = {60} />
                <span>Discover</span>
            </div>
            <div className = "side-bar-item" onClick={() => setPage('posts')}>
                <FiFileText size = {60} />
                <span>Posts</span>
            </div>
            <div className = "side-bar-item" onClick={() => setPage('events')}>
                <FiCalendar size = {60} />
                <span>Events</span>
            </div>
            <div className = "side-bar-item" onClick={() => setPage('account')}>
                <FiUser size = {60} />
                <span>Account</span>
            </div>
        </div>
    )
}

export default Sidebar;