// Sliding-window client-side rate limiter.
// Keyed by an arbitrary string (e.g. "check:listId" or "add:listId").
const history = {}

/**
 * Returns true and records the action if it is within the allowed rate.
 * Returns false (without recording) if the rate limit would be exceeded.
 *
 * @param {string} key        - Unique key identifying the action + scope
 * @param {number} maxActions - Max actions allowed within the window
 * @param {number} windowMs   - Rolling window duration in milliseconds
 */
export function checkRateLimit(key, maxActions, windowMs) {
  const now = Date.now()
  if (!history[key]) history[key] = []

  // Drop timestamps that have aged out of the window
  history[key] = history[key].filter((t) => now - t < windowMs)

  if (history[key].length >= maxActions) return false

  history[key].push(now)
  return true
}
