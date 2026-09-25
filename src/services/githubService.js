const CACHE_KEY = "gh_projects_cache_v4";
const CACHE_TTL = 60 * 60 * 1000; // 1 hour — the unauthenticated API allows 60 requests/hour per visitor IP
const MAX_PROJECTS = 10;

export const GITHUB_USERS = ["blaxezcode", "Blaxez"];

/** "my-cool-repo" → "My Cool Repo" */
const formatRepoName = (name) => name.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** Live link only when it really exists: the repo's homepage, or GitHub Pages if enabled. No guessing. */
function detectLiveUrl(repo) {
  const home = repo.homepage?.trim();
  if (home && /^https?:\/\//.test(home)) return home;
  if (repo.has_pages && repo.owner?.login) {
    const owner = repo.owner.login.toLowerCase();
    return repo.name.toLowerCase() === `${owner}.github.io` ? `https://${owner}.github.io` : `https://${owner}.github.io/${repo.name}`;
  }
  return null;
}

/** Curation: stars matter most, then having a description, then recent activity. */
function score(repo) {
  const ageDays = (Date.now() - new Date(repo.pushed_at || repo.updated_at).getTime()) / 86_400_000;
  return repo.stargazers_count * 5 + (repo.description ? 4 : 0) + (repo.homepage || repo.has_pages ? 2 : 0) + Math.max(0, 3 - ageDays / 120);
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (Date.now() - cached.timestamp > CACHE_TTL) return null;
    return cached.data;
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
  } catch {
    // Storage full or unavailable — fine, we just refetch next time.
  }
}

async function fetchUserRepos(user, signal) {
  try {
    const res = await fetch(`https://api.github.com/users/${user}/repos?per_page=100&sort=pushed`, {
      signal,
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    if (err?.name === "AbortError") throw err;
    return [];
  }
}

/** Curated, normalized projects from both accounts. Throws if nothing could be fetched. */
export async function fetchAllProjects(signal) {
  const cached = readCache();
  if (cached) return cached;

  const results = await Promise.all(GITHUB_USERS.map((u) => fetchUserRepos(u, signal)));
  const all = results.flat();
  if (all.length === 0) throw new Error("GitHub is unavailable right now.");

  const projects = all
    .filter((r) => !r.fork && !r.archived && !r.private && r.size > 0)
    .sort((a, b) => score(b) - score(a))
    .slice(0, MAX_PROJECTS)
    .map((repo) => ({
      id: repo.id,
      name: repo.name,
      owner: repo.owner?.login,
      title: formatRepoName(repo.name),
      description: repo.description || null,
      repoUrl: repo.html_url,
      liveUrl: detectLiveUrl(repo),
      stars: repo.stargazers_count,
      language: repo.language,
      topics: (repo.topics || []).slice(0, 3),
      updatedAt: repo.pushed_at || repo.updated_at,
    }));

  writeCache(projects);
  return projects;
}
