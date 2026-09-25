import { nav, site } from "@/content/site";

export default function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b from-bg via-bg/70 to-transparent" />
      <nav aria-label="Primary" className="page relative flex h-16 items-center justify-between">
        <a href="#top" className="flex min-h-11 items-center gap-3 text-ink">
          <span aria-hidden="true" className="t-label inline-flex size-8 items-center justify-center border border-line text-ink">
            SM
          </span>
          <span className="t-label sr-only sm:not-sr-only">{site.name}</span>
        </a>
        <ul className="flex items-center">
          {nav.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                data-nav={item.id}
                className="nav-link t-label relative flex min-h-11 items-center px-2 text-muted sm:px-3"
              >
                {item.label}
                <span
                  aria-hidden="true"
                  className="nav-underline absolute inset-x-2 bottom-2 h-px bg-signal sm:inset-x-3"
                />
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div aria-hidden="true" className="scroll-progress absolute inset-x-0 bottom-0 h-px bg-signal/80" />
    </header>
  );
}
