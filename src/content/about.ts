export interface Toolchain {
  title: string;
  items: { name: string; note: string }[];
}

export const toolchains: Toolchain[] = [
  {
    title: "Graphics",
    items: [
      { name: "DirectX 12 · DXR", note: "Explicit GPU, ray tracing" },
      { name: "WebGL2 · GLSL", note: "Real-time in the browser" },
      { name: "HLSL", note: "Shading, compute" },
      { name: "C++", note: "Engine & systems code" },
      { name: "Unreal Engine · Blender", note: "Content & prototyping" },
    ],
  },
  {
    title: "Product",
    items: [
      { name: "TypeScript", note: "End to end" },
      { name: "Next.js · React", note: "App Router, RSC" },
      { name: "Node.js · Express", note: "APIs & services" },
      { name: "Prisma · PostgreSQL", note: "Schema-first data" },
      { name: "Python · PyTorch", note: "Applied ML" },
    ],
  },
];

export interface RecordEntry {
  when: string;
  what: string;
  where: string;
}

export const record: RecordEntry[] = [
  {
    when: "2023–25",
    what: "Diploma, Computer Science & Engineering",
    where: "Maharishi University of Information Technology",
  },
  {
    when: "Hack-Shastra",
    what: "2nd place, IEEE software category: led a team to a working prototype in 48 hours against 15+ teams",
    where: "Hackathon",
  },
  {
    when: "2018",
    what: "Electrical & Electronics Engineering",
    where: "Ismail Yusuf College",
  },
];
