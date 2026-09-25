import SectionHeader from "@/components/ui/SectionHeader";
import { record, toolchains } from "@/content/about";

const delay = (i: number) => ({ "--i": i }) as React.CSSProperties;

export default function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="section-y relative bg-bg">
      <div className="page">
        <SectionHeader index="02" label="About" title="Two stacks, one discipline." titleId="about-title" />

        <div className="page-grid mt-12 gap-y-12 md:mt-16">
          <p className="t-lead col-span-4 max-w-[36ch] text-ink md:col-span-6 lg:col-span-5" data-reveal>
            I came to software through electronics and still think in signals and budgets. My work sits where the GPU
            pipeline meets the product: tools that need a renderer and a database behind them.
          </p>

          <div className="col-span-4 grid gap-12 md:col-span-6 md:grid-cols-2 lg:col-span-7">
            {toolchains.map((chain, c) => (
              <div key={chain.title}>
                <h3 className="t-label border-b border-line pb-3 text-muted" data-reveal style={delay(c)}>
                  {chain.title}
                </h3>
                <ul>
                  {chain.items.map((item, i) => (
                    <li
                      key={item.name}
                      className="group flex flex-col gap-1 border-b border-line py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
                      data-reveal
                      style={delay(c + i + 1)}
                    >
                      <span className="t-body flex items-baseline gap-3 text-ink transition-transform duration-300 ease-out group-hover:translate-x-2">
                        <span aria-hidden="true" className="size-1.5 shrink-0 translate-y-[-2px] bg-line transition-colors duration-150 group-hover:bg-signal" />
                        {item.name}
                      </span>
                      <span className="t-label pl-[18px] text-muted sm:pl-0 sm:text-right">{item.note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="page-grid mt-20 gap-y-6 md:mt-28">
          <h3 className="t-label col-span-4 text-muted md:col-span-6 lg:col-span-3" data-reveal>
            Record
          </h3>
          <ol className="col-span-4 md:col-span-6 lg:col-span-9">
            {record.map((entry, i) => (
              <li
                key={entry.what}
                className="grid grid-cols-[6.5rem_1fr] gap-x-6 gap-y-1 border-t border-line py-6 md:grid-cols-[9rem_1fr_auto]"
                data-reveal
                style={delay(i)}
              >
                <span className="t-label pt-1 text-signal">{entry.when}</span>
                <span className="t-body text-ink">{entry.what}</span>
                <span className="t-label col-start-2 text-muted md:col-start-3 md:pt-1 md:text-right">{entry.where}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
