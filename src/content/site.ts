export interface SiteLink {
  label: string;
  href: string;
}

export const site = {
  name: "Santosh Maurya",
  role: "Graphics & full-stack engineer",
  url: "https://blaxez.github.io/portfolio",
  location: "Mumbai, India",
  timeZone: "Asia/Kolkata",
  timeZoneLabel: "IST",
  email: "santoshmaurya0606200@gmail.com",
  /** Set to "/cv.pdf" once the file exists in /public. */
  cvPath: null as string | null,
  headline: "I build renderers, and the products around them.",
  intro:
    "Real-time graphics from WebGL2 to DirectX 12 and DXR, and the full-stack systems that ship them: Next.js, Node, Prisma, PostgreSQL.",
  links: [
    { label: "GitHub", href: "https://github.com/blaxezcode" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/santosh-maurya-a92988258" },
  ] satisfies SiteLink[],
} as const;

export const nav = [
  { id: "craft", label: "Craft" },
  { id: "about", label: "About" },
  { id: "work", label: "Work" },
  { id: "contact", label: "Contact" },
] as const;
