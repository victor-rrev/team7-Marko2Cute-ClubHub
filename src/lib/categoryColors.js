/**
 * Each CATEGORY gets a distinct Tailwind color palette so chips, filters,
 * and club logo fallbacks have visual variety. Tailwind only ships classes
 * it sees in source — these literal strings are how those classes get
 * picked up by the v4 content scanner.
 */
export const CATEGORY_COLORS = Object.freeze({
  Academic:
    'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300',
  Arts:
    'bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-300',
  Athletic:
    'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  Cultural:
    'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
  'Service & Volunteering':
    'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',
  'Religious & Spiritual':
    'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  STEM:
    'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
  'Creative Writing':
    'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300',
  'Hobbies & Games':
    'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  Wellness:
    'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  'Career & Professional':
    'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  'Politics & Activism':
    'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
})

const FALLBACK = 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'

export function categoryChipClass(cat) {
  return CATEGORY_COLORS[cat] ?? FALLBACK
}
