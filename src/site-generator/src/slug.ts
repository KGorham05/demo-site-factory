/**
 * Utility to create URL-safe slugs from business names.
 */

/**
 * Convert a business name (or any string) to a URL-safe slug.
 * e.g., "Mike's Plumbing & Drain" -> "mikes-plumbing-drain"
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/'/g, "") // remove apostrophes
    .replace(/&/g, "and") // ampersand -> "and"
    .replace(/[^a-z0-9]+/g, "-") // non-alphanumeric -> hyphen
    .replace(/^-+|-+$/g, "") // trim leading/trailing hyphens
    .replace(/-{2,}/g, "-"); // collapse multiple hyphens
}
