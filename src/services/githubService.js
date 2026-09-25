const CACHE_KEY = "gh_projects_cache_v2";
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

const GITHUB_USERS = ["blaxezcode", "Blaxez"];

/**
 * Deterministic placeholder images for project cards.
 * Keeps the existing visual style intact.
 */
const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=2670&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1614294149010-950b698f72c0?q=80&w=2670&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=2670&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1555949963-aa79dcee981c?q=80&w=2670&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=2669&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1547658719-da2b51169166?q=80&w=2664&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=2670&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1504639725590-34d0984388bd?q=80&w=2574&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1550439062-609e1531270e?q=80&w=2670&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=2670&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2670&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?q=80&w=2670&auto=format&fit=crop",
];

/**
 * Format a repo name for display:
 * "my-cool-repo" → "My Cool Repo"
 */
function formatRepoName(name) {
  return name.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Detect a live demo URL for a repository.
 * Priority: homepage field → GitHub Pages pattern → null
 */
function detectLiveUrl(repo) {
  if (repo.homepage && repo.homepage.trim() !== "") {
    return repo.homepage.trim();
  }

  // GitHub Pages pattern
  const owner = repo.owner?.login;
  if (owner) {
    return `https://${owner}.github.io/${repo.name}`;
  }

  return null;
}

/**
 * Try to read cached projects from localStorage.
 * Returns null if cache is missing or expired.
 */
function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const cached = JSON.parse(raw);
    if (Date.now() - cached.timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return cached.data;
  } catch {
    return null;
  }
}

/**
 * Write projects to localStorage cache.
 */
function writeCache(data) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ timestamp: Date.now(), data }),
    );
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

/**
 * Fetch repos for a single user. Returns [] on failure so one
 * account failing doesn't block the other.
 */
async function fetchUserRepos(user) {
  try {
    const res = await fetch(
      `https://api.github.com/users/${user}/repos?per_page=100`,
    );
    if (!res.ok) {
      console.warn(`GitHub API error for ${user}: ${res.status}`);
      return [];
    }
    return await res.json();
  } catch (err) {
    console.warn(`Failed to fetch repos for ${user}:`, err);
    return [];
  }
}

/**
 * Fetch, filter, sort, and normalize repositories from both GitHub accounts.
 * Each account is fetched independently — if one fails, the other still works.
 * Returns an array of normalized project objects.
 */
export async function fetchAllProjects() {
  // Check cache first
  const cached = readCache();
  if (cached) return cached;

  // Fetch both accounts in parallel — each resilient independently
  const results = await Promise.all(
    GITHUB_USERS.map((user) => fetchUserRepos(user)),
  );

  const allRepos = results.flat();

  if (allRepos.length === 0) {
    throw new Error("No repositories could be fetched from either account.");
  }

  // Filter: no forks, no archived, public only
  const filtered = allRepos.filter(
    (repo) => !repo.fork && !repo.archived && !repo.private,
  );

  // Sort by updated_at descending
  filtered.sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );

  // Normalize
  const projects = filtered.map((repo, i) => ({
    id: repo.id,
    name: repo.name,
    title: formatRepoName(repo.name),
    description: repo.description || null,
    repoUrl: repo.html_url,
    liveUrl: detectLiveUrl(repo),
    stars: repo.stargazers_count,
    language: repo.language,
    cat: repo.language || "Code",
    img: PLACEHOLDER_IMAGES[i % PLACEHOLDER_IMAGES.length],
    updatedAt: repo.updated_at,
  }));

  writeCache(projects);
  return projects;
}
