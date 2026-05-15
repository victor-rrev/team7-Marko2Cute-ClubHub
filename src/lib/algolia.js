import { algoliasearch } from 'algoliasearch'

const appId = import.meta.env.VITE_ALGOLIA_APP_ID
const searchKey = import.meta.env.VITE_ALGOLIA_SEARCH_KEY

/**
 * Algolia client used by `services/search.js`. Null when the env vars
 * aren't set — services should fall back to the client-side substring
 * search in that case so search keeps working before Algolia is wired up.
 *
 * Use the search-only API key (NOT the admin key) for client SDK calls.
 */
export const algoliaClient =
  appId && searchKey ? algoliasearch(appId, searchKey) : null

export const CLUBS_INDEX = 'clubs'
