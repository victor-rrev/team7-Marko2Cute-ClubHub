import './AccountProfile.css';
import { FiUser } from 'react-icons/fi';

function AccountProfile({ variant = 'small' }) {

  if (variant === "large") {
    return (
        <div className="account-profile-large">
        <FiUser size={150} />
        </div>
    )
  }

  return (
    <div className="account-profile">
      <FiUser size={30} />
    </div>
  );
}

export default AccountProfile;