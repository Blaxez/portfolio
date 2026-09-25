import { Fragment } from "react";
import CopyEmail from "@/components/ui/CopyEmail";
import { ArrowUp, ArrowUpRight } from "@/components/ui/icons";
import LocalTime from "@/components/ui/LocalTime";
import { site } from "@/content/site";
import { assetPath } from "@/lib/paths";

const STATEMENT = ["Let's", "build", "something", "that", "renders."];

export default function Contact() {
  const year = new Date().getFullYear();
  return (
    <section id="contact" aria-labelledby="contact-title" className="relative flex min-h-svh flex-col">
      <div className="page flex flex-1 flex-col justify-end pt-[42svh] pb-16 md:justify-center md:pt-32 md:pb-24">
        <p className="t-label text-muted" data-reveal>
          <span className="text-signal">04</span> — Contact
        </p>
        <h2 id="contact-title" className="t-statement mt-6 max-w-[11ch] text-ink" data-statement>
          {STATEMENT.map((word, i) => (
            <Fragment key={word}>
              <span className="inline-block overflow-hidden pb-[0.08em] align-bottom">
                <span data-word className="inline-block">
                  {word}
                </span>
              </span>
              {i < STATEMENT.length - 1 ? " " : null}
            </Fragment>
          ))}
        </h2>
        <p className="t-lead mt-8 max-w-[38ch] text-muted" data-reveal>
          Graphics, engine or full-stack: if it has to be fast and correct, I&apos;d like to hear about it.
        </p>
        <div className="mt-10" data-reveal>
          <CopyEmail email={site.email} />
        </div>
        <ul className="t-label mt-10 flex flex-wrap items-center gap-x-8 gap-y-2 text-muted" data-reveal>
          {site.links.map((link) => (
            <li key={link.href}>
              <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-link inline-flex min-h-11 items-center gap-2 text-ink">
                {link.label} <ArrowUpRight />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </li>
          ))}
          {site.cvPath ? (
            <li>
              <a href={assetPath(site.cvPath)} className="text-link inline-flex min-h-11 items-center gap-2 text-ink" download>
                CV (PDF) <ArrowUpRight />
              </a>
            </li>
          ) : null}
          <li className="flex min-h-11 items-center gap-2">
            {site.location.split(",")[0]} · <LocalTime timeZone={site.timeZone} label={site.timeZoneLabel} />
          </li>
        </ul>
      </div>

      <footer className="page t-label flex flex-col gap-4 border-t border-line py-6 text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {year} {site.name}
        </p>
        <p>Rendered with WebGL2 in a Web Worker · Next.js · GSAP</p>
        <a href="#top" className="inline-flex min-h-11 items-center gap-2 text-ink transition-colors hover:text-signal">
          Back to top <ArrowUp />
        </a>
      </footer>
    </section>
  );
}
