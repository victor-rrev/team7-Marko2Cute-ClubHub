import './Sidebar.css';
import { FiCompass, FiFileText, FiCalendar, FiUser } from 'react-icons/fi';

function Sidebar(){
    return (
        <div className = "sidebar">
            <div className = "side-bar-item">
                <FiCompass size = {60} />
                <span>Discover</span>
            </div>
            <div className = "side-bar-item">
                <FiFileText size = {60} />
                <span>Posts</span>
            </div>
            <div className = "side-bar-item">
                <FiCalendar size = {60} />
                <span>Events</span>
            </div>
            <div className = "side-bar-item">
                <FiUser size = {60} />
                <span>Account</span>
            </div>
        </div>
    )
}

export default Sidebar;