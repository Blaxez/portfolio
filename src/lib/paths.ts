const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Prefix a /public path with the deploy basePath (GitHub Pages serves under /portfolio). */
export const assetPath = (path: string): string => `${basePath}${path}`;
