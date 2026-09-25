/**
 * Case studies for the Work beat.
 *
 * Entries flagged `seed: true` are placeholder copy written from the stated
 * stack. Replace title/summary/problem/approach/outcome/metrics/links with the
 * real project and set `seed: false`. In development a SEED badge marks them.
 *
 * `schematic` renders an inline SVG architecture diagram as the cover.
 * Set `cover` (e.g. "/work/dxr-renderer.avif", 1600×1000) to use an image instead.
 */

export interface SchematicNode {
  id: string;
  label: string;
  /** Grid position: col 0–5, row 0–2. */
  col: number;
  row: number;
  hot?: boolean;
}

export interface Project {
  slug: string;
  seed: boolean;
  title: string;
  kind: string;
  year: string;
  role: string;
  summary: string;
  problem: string;
  approach: string;
  outcome: string;
  stack: string[];
  metrics: { label: string; value: string }[];
  links: { label: string; href: string }[];
  cover: string | null;
  schematic: { nodes: SchematicNode[]; edges: [string, string][] };
}

export const projects: Project[] = [
  {
    slug: "dxr-hybrid-renderer",
    seed: true,
    title: "Hybrid DXR Renderer",
    kind: "Graphics · Engine",
    year: "2025",
    role: "Solo — engine, shaders, tooling",
    summary:
      "A DirectX 12 deferred renderer that layers DXR ray-traced shadows and reflections over a rasterised G-buffer.",
    problem:
      "Pure ray tracing is too expensive for a stable frame budget on mid-range GPUs, while raster-only shadows and reflections break down on dynamic, glossy scenes.",
    approach:
      "Rasterise primary visibility into a G-buffer, then trace only the rays raster can't answer: one shadow ray per light and roughness-gated reflection rays. BLAS/TLAS rebuilds are split so static geometry is built once and dynamic instances are refit per frame; a temporal denoiser stabilises low sample counts.",
    outcome:
      "Ray-traced shadows and reflections in a hybrid pipeline with explicit resource barriers and a render graph that makes each pass independently profilable in PIX.",
    stack: ["C++20", "DirectX 12", "DXR 1.1", "HLSL", "PIX"],
    metrics: [
      { label: "Pipeline", value: "Raster + RT" },
      { label: "Budget", value: "16.6 ms" },
      { label: "Accel. structs", value: "BLAS / TLAS refit" },
    ],
    links: [],
    cover: null,
    schematic: {
      nodes: [
        { id: "scene", label: "Scene / TLAS", col: 0, row: 1 },
        { id: "gbuf", label: "G-Buffer", col: 1, row: 1 },
        { id: "shadow", label: "RT Shadows", col: 2, row: 0, hot: true },
        { id: "refl", label: "RT Reflections", col: 2, row: 2, hot: true },
        { id: "denoise", label: "Denoise", col: 3, row: 1 },
        { id: "light", label: "Lighting", col: 4, row: 1 },
        { id: "taa", label: "TAA · Present", col: 5, row: 1 },
      ],
      edges: [
        ["scene", "gbuf"],
        ["gbuf", "shadow"],
        ["gbuf", "refl"],
        ["shadow", "denoise"],
        ["refl", "denoise"],
        ["denoise", "light"],
        ["light", "taa"],
      ],
    },
  },
  {
    slug: "webgl2-deferred",
    seed: true,
    title: "WebGL2 Deferred Pipeline",
    kind: "Graphics · Web",
    year: "2024",
    role: "Solo — renderer & loader",
    summary:
      "A browser renderer with a multi-render-target G-buffer, clustered lighting and physically based shading, written directly against WebGL2.",
    problem:
      "Forward rendering in the browser scales poorly with light count, and general-purpose engines ship far more code than a focused visualisation needs.",
    approach:
      "A thin TypeScript layer over WebGL2: MRT G-buffer, lights binned into a view-space cluster grid, one full-screen PBR resolve, then bloom and tone mapping. Geometry streams from glTF with typed-array views and no intermediate copies.",
    outcome:
      "Dense dynamic lighting in a bundle small enough to load on a phone, with every pass inspectable in a debug overlay.",
    stack: ["TypeScript", "WebGL2", "GLSL ES 3.0", "glTF"],
    metrics: [
      { label: "Lighting", value: "Clustered" },
      { label: "G-buffer", value: "3 × MRT" },
      { label: "Runtime deps", value: "0" },
    ],
    links: [],
    cover: null,
    schematic: {
      nodes: [
        { id: "gltf", label: "glTF stream", col: 0, row: 1 },
        { id: "gbuf", label: "MRT G-Buffer", col: 1, row: 1 },
        { id: "cluster", label: "Light clusters", col: 2, row: 0, hot: true },
        { id: "pbr", label: "PBR resolve", col: 3, row: 1, hot: true },
        { id: "bloom", label: "Bloom", col: 4, row: 2 },
        { id: "tone", label: "Tonemap", col: 5, row: 1 },
      ],
      edges: [
        ["gltf", "gbuf"],
        ["gbuf", "pbr"],
        ["cluster", "pbr"],
        ["pbr", "bloom"],
        ["pbr", "tone"],
        ["bloom", "tone"],
      ],
    },
  },
  {
    slug: "fullstack-platform",
    seed: true,
    title: "Full-Stack Product Platform",
    kind: "Product · Full-stack",
    year: "2024",
    role: "Lead — architecture to deploy",
    summary:
      "A multi-tenant web product built schema-first: Next.js App Router on the front, an Express API and Prisma over PostgreSQL behind it.",
    problem:
      "A prototype had outgrown its ad-hoc data layer: inconsistent validation, N+1 queries on core screens, and no safe way to evolve the schema.",
    approach:
      "Moved to a Prisma schema as the single source of truth, generated typed clients shared across API and UI, and pushed rendering to React Server Components so data is fetched once, close to the database. Long-running work moved to a queue-backed worker.",
    outcome:
      "One typed contract from table to component, migrations that run in CI, and pages that stream from the server instead of waterfalling on the client.",
    stack: ["Next.js", "TypeScript", "Node.js", "Express", "Prisma", "PostgreSQL"],
    metrics: [
      { label: "Contract", value: "Schema-first" },
      { label: "Rendering", value: "RSC + streaming" },
      { label: "Migrations", value: "In CI" },
    ],
    links: [],
    cover: null,
    schematic: {
      nodes: [
        { id: "client", label: "Browser", col: 0, row: 1 },
        { id: "next", label: "Next.js RSC", col: 1, row: 1, hot: true },
        { id: "api", label: "Express API", col: 2, row: 0 },
        { id: "prisma", label: "Prisma", col: 3, row: 1, hot: true },
        { id: "queue", label: "Job queue", col: 3, row: 2 },
        { id: "pg", label: "PostgreSQL", col: 5, row: 1 },
      ],
      edges: [
        ["client", "next"],
        ["next", "api"],
        ["next", "prisma"],
        ["api", "prisma"],
        ["api", "queue"],
        ["prisma", "pg"],
        ["queue", "pg"],
      ],
    },
  },
];
