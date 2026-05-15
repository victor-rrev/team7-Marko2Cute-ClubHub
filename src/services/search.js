import { algoliaClient, CLUBS_INDEX } from '../lib/algolia'
import { listClubs } from './clubs'

/**
 * Searches active clubs by name, description, or category. Returns up
 * to `opts.limit` matches (default 20).
 *
 * Routes to Algolia when the env keys are configured (live in prod /
 * any environment with VITE_ALGOLIA_APP_ID + VITE_ALGOLIA_SEARCH_KEY).
 * Falls back to a client-side substring scan otherwise, so dev without
 * Algolia secrets still works.
 *
 * @param {string} query
 * @param {{ limit?: number }} [opts]
 * @returns {Promise<Array<object>>}
 */
export async function searchClubs(query, opts = {}) {
  const trimmed = query?.trim() ?? ''
  if (!trimmed) return []
  if (algoliaClient) return searchViaAlgolia(trimmed, opts)
  return searchClientSide(trimmed, opts)
}

async function searchViaAlgolia(query, opts) {
  const limit = opts.limit ?? 20
  const result = await algoliaClient.searchSingleIndex({
    indexName: CLUBS_INDEX,
    searchParams: { query, hitsPerPage: limit },
  })
  // Algolia returns the doc's Firestore ID as `objectID`.
  return result.hits
    .filter((hit) => !hit.deletedAt)
    .map((hit) => ({ id: hit.objectID, ...hit }))
}

async function searchClientSide(query, opts) {
  const needle = query.toLowerCase()
  const limit = opts.limit ?? 20
  const all = await listClubs()
  return all
    .filter((club) => {
      if (club.name && club.name.toLowerCase().includes(needle)) return true
      if (
        club.description &&
        club.description.toLowerCase().includes(needle)
      ) {
        return true
      }
      if (Array.isArray(club.categories)) {
        return club.categories.some((cat) =>
          cat.toLowerCase().includes(needle),
        )
      }
      return false
    })
    .slice(0, limit)
}
