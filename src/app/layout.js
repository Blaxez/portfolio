import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import SmoothScroll from "@/components/providers/SmoothScroll";
import Cursor from "@/components/fx/Cursor";
import { getAssetPath } from "@/lib/assets";
import { SITE } from "@/lib/site";
import { Instrument_Serif, Instrument_Sans } from "next/font/google";

const serif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-instrument-serif",
});
const sans = Instrument_Sans({ subsets: ["latin"], display: "swap", variable: "--font-instrument-sans" });

const title = `${SITE.name} — ${SITE.role}`;

export const metadata = {
  metadataBase: new URL(SITE.url),
  title,
  description: SITE.description,
  authors: [{ name: SITE.name }],
  openGraph: { type: "website", url: SITE.url, title, description: SITE.description, siteName: SITE.name },
  twitter: { card: "summary_large_image", title, description: SITE.description },
};

export const viewport = {
  themeColor: "#0b0a09",
};

// Applied before first paint: no theme flash. Dark is the default; an explicit choice is remembered.
const themeScript = `(function(){var d=document.documentElement;try{if(localStorage.getItem("theme")==="light"){d.classList.remove("dark")}else{d.classList.add("dark")}}catch(e){}try{if(sessionStorage.getItem("intro"))d.classList.add("intro-seen")}catch(e){}})()`;

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`dark ${serif.variable} ${sans.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ThemeProvider>
          <SmoothScroll />
          <Cursor />
          <div
            aria-hidden="true"
            className="grain"
            style={{ backgroundImage: `url('${getAssetPath("/assets/noise.svg")}')` }}
          />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
