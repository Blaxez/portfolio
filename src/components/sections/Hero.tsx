import RenderHud from "@/components/stage/RenderHud";
import { ArrowDown, ArrowUpRight } from "@/components/ui/icons";
import { site } from "@/content/site";

const delay = (i: number) => ({ "--i": i }) as React.CSSProperties;

export default function Hero() {
  return (
    <section id="top" aria-labelledby="hero-title" className="relative">
      <div data-hero-inner className="page flex min-h-svh flex-col justify-end pt-28 pb-12 md:justify-center md:pb-20">
        <div className="max-w-[40rem]">
          <p className="t-label intro-rise text-muted" style={delay(0)}>
            <span className="text-signal">00</span> — {site.role} · {site.location}
          </p>
          <h1 id="hero-title" className="t-display intro-settle mt-6 text-ink">
            Santosh
            <br />
            Maurya
          </h1>
          <p className="t-lead intro-rise mt-8 max-w-[30ch] text-ink" style={delay(1)}>
            {site.headline}
          </p>
          <p className="t-body intro-rise mt-4 hidden max-w-[46ch] text-muted sm:block" style={delay(2)}>
            {site.intro}
          </p>
          <div className="intro-rise mt-10 flex flex-wrap gap-3" style={delay(3)}>
            <a href="#work" className="btn btn-primary">
              See the work <ArrowUpRight className="btn-arrow" />
            </a>
            <a href="#contact" className="btn">
              Get in touch
            </a>
          </div>
        </div>
      </div>

      <div
        data-hud
        className="intro-rise pointer-events-none absolute top-20 right-[var(--page-margin)] left-[var(--page-margin)] md:top-auto md:bottom-20 md:left-auto md:w-[280px]"
        style={delay(4)}
      >
        <RenderHud />
      </div>

      <a
        href="#craft"
        className="t-label intro-rise absolute bottom-6 left-1/2 hidden -translate-x-1/2 items-center gap-2 text-muted transition-colors hover:text-ink md:flex"
        style={delay(5)}
      >
        Scroll — the frame builds as you go <ArrowDown />
      </a>
    </section>
  );
}
