import './Sidebar.css';
import { FiCompass, FiFileText, FiCalendar, FiUser } from 'react-icons/fi';
import { Link } from 'react-router-dom';

function Sidebar(){
    return (
        <div className = "sidebar">
            <div className = "side-bar-item">
                <Link to="/discover">
                    <FiCompass size = {60} />
                    <span>Discover</span>
                </Link>
            </div>
            <div className = "side-bar-item">
                <Link to="/posts">
                    <FiFileText size = {60} />
                    <span>Posts</span>
                </Link>
            </div>
            <div className = "side-bar-item">
                <Link to="/events">
                    <FiCalendar size = {60} />
                    <span>Events</span>
                </Link>
            </div>
            <div className = "side-bar-item">
                <Link to="/account">
                    <FiUser size = {60} />
                    <span>Account</span>
                </Link>
            </div>
        </div>
    )
}

export default Sidebar;