import LiveTris from "@/components/stage/LiveTris";
import { stages } from "@/content/stages";

const pad = (n: number) => String(n).padStart(2, "0");

function Tech({ text }: { text: string }) {
  const [before, after] = text.split("{tris}");
  if (after === undefined) return <>{text}</>;
  return (
    <>
      {before}
      <LiveTris />
      {after}
    </>
  );
}

export default function Craft() {
  return (
    <section id="craft" aria-labelledby="craft-title" className="craft-track scroll-mt-0" data-craft>
      <div className="craft-sticky">
        <div className="page flex h-full flex-col justify-end pt-24 pb-8 md:justify-between md:pb-12">
          <h2 id="craft-title" className="t-label text-muted">
            <span className="text-signal">01</span> — Craft · <span className="text-ink">How a frame gets made</span>
          </h2>

          <div className="craft-panels mt-6 md:mt-0 md:max-w-[34rem]">
            {stages.map((stage, i) => (
              <article
                key={stage.pass}
                className="craft-panel"
                data-craft-panel={i}
                data-active={i === 0 ? "" : undefined}
                aria-labelledby={`pass-${i}`}
              >
                <p className="t-label text-muted">
                  Pass <span className="text-signal">{pad(i + 1)}</span> / {pad(stages.length)} — {stage.pass}
                </p>
                <h3 id={`pass-${i}`} className="t-title mt-4 text-ink">
                  {stage.principle}
                </h3>
                <p className="t-body mt-5 max-w-[44ch] text-muted">{stage.body}</p>
                <p className="t-label mt-6 flex max-w-[48ch] gap-3 border-t border-line pt-4 normal-case tracking-normal text-muted">
                  <span aria-hidden="true" className="text-signal">
                    ▸
                  </span>
                  <span>
                    <Tech text={stage.tech} />
                  </span>
                </p>
              </article>
            ))}
          </div>

          <ol className="mt-8 grid grid-cols-5 gap-2 md:mt-0 md:max-w-[34rem] md:gap-3" aria-label="Render passes">
            {stages.map((stage, i) => (
              <li key={stage.pass} className="craft-rail-item t-label text-muted" data-craft-rail={i} data-active={i === 0 ? "" : undefined}>
                <span className="relative block h-px w-full overflow-hidden bg-line">
                  <span data-craft-fill className="absolute inset-0 origin-left scale-x-0 bg-signal" />
                </span>
                <span className="mt-3 hidden items-center gap-2 lg:flex">
                  <span className="craft-rail-dot size-1.5 rounded-full border border-muted" aria-hidden="true" />
                  {stage.pass}
                </span>
                <span className="mt-3 block lg:hidden">{pad(i + 1)}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
