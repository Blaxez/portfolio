import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ScrollPersistence } from "@/components/hooks/useScrollPersistence";
import { getAssetPath } from "@/lib/assets";
import { Anton, Space_Grotesk, Playfair_Display } from "next/font/google";

/* ── Self-hosted Google Fonts (downloaded at build time) ── */
const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-anton",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
});

export const metadata = {
  title: "Santosh Maurya — Full-Stack Developer | AI & ML | Game Dev",
  description:
    "Portfolio of Santosh Maurya — Full-Stack Developer, AI/ML Innovator, and Game Developer.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`dark ${anton.variable} ${spaceGrotesk.variable} ${playfairDisplay.variable}`}
    >
      <head></head>
      <body className="selection:bg-[var(--acc)] selection:text-white">
        <ThemeProvider>
          <ScrollPersistence />
          {/* Film Grain Overlay */}
          <div
            className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.07]"
            style={{
              backgroundImage: `url('${getAssetPath("/assets/noise.svg")}')`,
              mixBlendMode: "overlay",
            }}
          />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
