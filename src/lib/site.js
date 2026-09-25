/** Single source for identity, links and contact details. */
export const SITE = {
  name: "Santosh Maurya",
  monogram: "SM",
  role: "Full-Stack Developer · AI/ML · Game Dev",
  description:
    "Portfolio of Santosh Maurya — full-stack developer building web platforms, applied AI/ML and real-time games.",
  url: "https://blaxez.github.io/portfolio",
  email: "santoshmaurya0606200@gmail.com",
  location: "Mumbai, India",
  timeZone: "Asia/Kolkata",
  timeZoneLabel: "IST",
  /** Set to "/cv.pdf" once the file is in /public — the CV button appears automatically. */
  cvPath: null,
  /** Optional form endpoint (e.g. https://formspree.io/f/xxxx). Without it the form opens a pre-filled email. */
  formEndpoint: process.env.NEXT_PUBLIC_FORM_ENDPOINT || null,
  socials: [
    { id: "github", label: "GitHub", href: "https://github.com/blaxezcode" },
    { id: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/in/santosh-maurya-a92988258" },
  ],
};

export const SECTIONS = [
  { id: "hero", label: "Intro" },
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "strengths", label: "Strengths" },
  { id: "projects", label: "Work" },
  { id: "metrics", label: "Numbers" },
  { id: "contact", label: "Contact" },
];
