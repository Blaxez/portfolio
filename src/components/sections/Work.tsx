import SectionHeader from "@/components/ui/SectionHeader";
import { ArrowUpRight } from "@/components/ui/icons";
import { projects, type Project } from "@/content/projects";
import { assetPath } from "@/lib/paths";
import Schematic from "./Schematic";

const delay = (i: number) => ({ "--i": i }) as React.CSSProperties;
const pad = (n: number) => String(n).padStart(2, "0");
const showSeedBadge = process.env.NODE_ENV === "development";

const seedCount = projects.filter((p) => p.seed).length;
if (seedCount > 0 && process.env.NODE_ENV === "production") {
  console.warn(`[portfolio] ${seedCount} seed case stud${seedCount === 1 ? "y" : "ies"} in src/content/projects.ts — replace before publishing.`);
}

function Chapter({ project, index }: { project: Project; index: number }) {
  const titleId = `work-${project.slug}`;
  return (
    <article aria-labelledby={titleId} className="page-grid gap-y-10 border-t border-line pt-10 md:pt-14">
      <header className="col-span-4 self-start md:col-span-6 lg:sticky lg:top-24 lg:col-span-4">
        <p className="t-label text-muted" data-reveal>
          <span className="text-signal">03.{index + 1}</span> — {project.kind}
          {showSeedBadge && project.seed ? <span className="ml-3 bg-signal px-1.5 py-0.5 text-bg">Seed</span> : null}
        </p>
        <h3 id={titleId} className="t-heading mt-4 text-ink" data-reveal style={delay(1)}>
          {project.title}
        </h3>
        <dl className="t-label mt-6 grid grid-cols-[5rem_1fr] gap-y-2 text-muted" data-reveal style={delay(2)}>
          <dt>Year</dt>
          <dd className="text-ink">{project.year}</dd>
          <dt>Role</dt>
          <dd className="text-ink normal-case tracking-normal">{project.role}</dd>
        </dl>
        <ul className="mt-6 flex flex-wrap gap-2" aria-label="Stack" data-reveal style={delay(3)}>
          {project.stack.map((tech) => (
            <li key={tech} className="chip">
              {tech}
            </li>
          ))}
        </ul>
        {project.links.length > 0 ? (
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2" data-reveal style={delay(4)}>
            {project.links.map((link) => (
              <li key={link.href}>
                <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-link t-label inline-flex min-h-11 items-center gap-2 text-ink">
                  {link.label} <ArrowUpRight />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </header>

      <div className="col-span-4 md:col-span-6 lg:col-span-8">
        <figure className="group relative aspect-[12/5] overflow-hidden border border-line bg-surface" data-cover data-reveal>
          <div data-cover-inner className="absolute inset-0">
            {project.cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={assetPath(project.cover)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
            ) : (
              <Schematic project={project} />
            )}
          </div>
          <div data-cover-mask aria-hidden="true" className="cover-mask pointer-events-none absolute inset-0 bg-bg" style={{ transform: "scaleY(0)" }} />
        </figure>
        <p className="t-label mt-3 text-muted" aria-hidden="true">
          Fig. {pad(index + 1)} — {project.cover ? project.title : "Architecture"}
        </p>

        <p className="t-lead mt-10 max-w-[40ch] text-ink" data-reveal>
          {project.summary}
        </p>

        <dl className="mt-10">
          {(
            [
              ["Problem", project.problem],
              ["Approach", project.approach],
              ["Outcome", project.outcome],
            ] as const
          ).map(([label, text], i) => (
            <div key={label} className="grid gap-2 border-t border-line py-6 md:grid-cols-[9rem_1fr] md:gap-6" data-reveal style={delay(i)}>
              <dt className="t-label pt-1 text-muted">{label}</dt>
              <dd className="t-body max-w-[62ch] text-ink">{text}</dd>
            </div>
          ))}
        </dl>

        <dl className="grid grid-cols-1 border-t border-line sm:grid-cols-3">
          {project.metrics.map((metric, i) => (
            <div key={metric.label} className="border-line py-6 sm:border-l sm:px-6 sm:first:border-l-0 sm:first:pl-0" data-reveal style={delay(i)}>
              <dt className="t-label text-muted">{metric.label}</dt>
              <dd className="t-heading mt-2 text-ink">{metric.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </article>
  );
}

export default function Work() {
  return (
    <section id="work" aria-labelledby="work-title" className="section-y relative bg-bg">
      <div className="page">
        <SectionHeader
          index="03"
          label="Work"
          title="Selected work, taken apart."
          titleId="work-title"
          aside={<p className="t-label text-muted">{pad(projects.length)} case studies</p>}
        />
        <div className="mt-12 flex flex-col gap-24 md:mt-16 md:gap-32">
          {projects.map((project, i) => (
            <Chapter key={project.slug} project={project} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
