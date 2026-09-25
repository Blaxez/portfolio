/** The five render passes the hero teapot is scrubbed through in the Craft beat. */
export interface Stage {
  pass: string;
  principle: string;
  body: string;
  /** What the GPU is doing; `{tris}` is replaced with the live triangle count. */
  tech: string;
}

export const stages: Stage[] = [
  {
    pass: "Geometry",
    principle: "Structure before surface.",
    body: "I start with the data model: schemas, contracts, the shape of the problem. Everything downstream is only as good as the mesh it is built on.",
    tech: "32 bicubic Bézier patches, tessellated on load into {tris} triangles.",
  },
  {
    pass: "Normals",
    principle: "Know which way things face.",
    body: "Clear interfaces decide orientation: typed APIs, explicit boundaries, no hidden state. When every surface declares its direction, the rest of the pipeline can trust it.",
    tech: "Per-vertex normals from the patch derivatives ∂P/∂u × ∂P/∂v.",
  },
  {
    pass: "Depth",
    principle: "Measure what's in front.",
    body: "Profile first, then optimise what the user actually sees. Budgets are set in milliseconds and kilobytes, not in guesses.",
    tech: "Linearised view-space depth, the buffer every later pass leans on.",
  },
  {
    pass: "Lighting",
    principle: "Physically based.",
    body: "Correctness comes from respecting real constraints: frame budgets, network latency, lock contention. Move your pointer; you are holding the key light.",
    tech: "Cook-Torrance BRDF: GGX distribution, Smith geometry, Schlick Fresnel.",
  },
  {
    pass: "Composite",
    principle: "Ship the frame.",
    body: "None of it matters until it reaches the screen on time, every time. I own the last mile: CI, deploys, monitoring, and the 16.6 ms that make it feel instant.",
    tech: "Image-based reflections, ACES tone mapping, dithered to 8-bit.",
  },
];
