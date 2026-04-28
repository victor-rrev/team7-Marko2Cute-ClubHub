import { listClubs } from './clubs';

/**
 * Searches active clubs by name, description, or category. Returns up
 * to `opts.limit` matches (default 20).
 *
 * **MVP implementation:** client-side substring match over all clubs
 * fetched via `listClubs`. Fine for one school's worth of clubs (tens
 * to low hundreds). When the Algolia Firebase Extension is installed
 * (post-Blaze upgrade), swap this body for an Algolia query — frontend
 * callers don't need to change. Setup steps live in `docs/backend-api.md`
 * under "Search → Activating Algolia".
 *
 * @param {string} query
 * @param {{ limit?: number }} [opts]
 * @returns {Promise<Array<object>>}
 */
export async function searchClubs(query, opts = {}) {
  if (!query || !query.trim()) return [];
  const needle = query.trim().toLowerCase();
  const limit = opts.limit || 20;

  const all = await listClubs();
  return all
      .filter((club) => {
        if (club.name && club.name.toLowerCase().includes(needle)) return true;
        if (
          club.description
          && club.description.toLowerCase().includes(needle)
        ) {
          return true;
        }
        if (Array.isArray(club.categories)) {
          return club.categories.some(
              (cat) => cat.toLowerCase().includes(needle),
          );
        }
        return false;
      })
      .slice(0, limit);
}
