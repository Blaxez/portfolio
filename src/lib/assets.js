/**
 * Centralized asset path utility.
 *
 * In production the app is served under a basePath (e.g. "/portfolio" on
 * GitHub Pages). All references to files inside `public/` must be prefixed
 * with that basePath so the browser can resolve them.
 *
 * Usage:
 *   import { getAssetPath } from "@/lib/assets";
 *   <img src={getAssetPath("/assets/mascott-v2.png")} />
 */

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/**
 * Prefix a public-folder path with the configured basePath.
 * @param {string} path – must start with "/"
 * @returns {string}
 */
export function getAssetPath(path) {
  return `${basePath}${path}`;
}
