import { useAuth } from '../contexts/AuthContext'

export default function SignInScreen() {
  const { signIn } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center space-y-6">
        <h1 className="text-5xl font-bold text-orange-500">ClubHub</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Discover clubs and events at your school.
        </p>
        <button
          onClick={signIn}
          className="inline-flex items-center gap-3 px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium text-gray-900 dark:text-gray-100 shadow-sm"
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            width="20"
            alt=""
          />
          Sign in with Google
        </button>
      </div>
    </div>
  )
}
