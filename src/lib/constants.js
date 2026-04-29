/**
 * App-wide enums also enforced in `firestore.rules`. When you change one
 * of these lists, update the rule file too — they're duplicated by design
 * (Rules can't import JS) and drift between them is the most common
 * source of "works locally, breaks in prod" bugs.
 */

export const CATEGORIES = Object.freeze([
  'Academic',
  'Arts',
  'Athletic',
  'Cultural',
  'Service & Volunteering',
  'Religious & Spiritual',
  'STEM',
  'Creative Writing',
  'Hobbies & Games',
  'Wellness',
  'Career & Professional',
  'Politics & Activism',
]);

export const GRADE_LEVELS = Object.freeze([
  'freshman', 'sophomore', 'junior', 'senior',
]);

export const PRONOUNS = Object.freeze(['he/him', 'she/her', 'they/them']);

export const REACTIONS = Object.freeze(['👍', '❤️', '🎉', '😂', '😮', '🔥']);

export const CLUB_ROLES = Object.freeze(['owner', 'admin', 'member']);

export const JOIN_POLICIES = Object.freeze(['open', 'approval']);

export const POST_SCOPES = Object.freeze(['club', 'global', 'both']);

export const RSVP_STATES = Object.freeze(['going', 'maybe', 'not_going']);
