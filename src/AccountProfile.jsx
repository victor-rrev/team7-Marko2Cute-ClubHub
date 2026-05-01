import './AccountProfile.css';
import { FiUser } from 'react-icons/fi';

function AccountProfile({ variant = 'small' }) {
  const size = variant === 'large' ? 100 : 30;
  const className = variant === 'large' ? 'account-profile-large' : 'account-profile';

  return (
    <div className={className}>
      <FiUser size={size} />
    </div>
  );
}

export default AccountProfile;