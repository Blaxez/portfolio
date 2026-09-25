interface SectionHeaderProps {
  index: string;
  label: string;
  title: string;
  titleId: string;
  aside?: React.ReactNode;
}

/** Every beat opens the same way: mono index + label, then the title. */
export default function SectionHeader({ index, label, title, titleId, aside }: SectionHeaderProps) {
  return (
    <header className="page-grid items-end gap-y-6 border-b border-line pb-8 md:pb-12">
      <div className="col-span-4 md:col-span-4 lg:col-span-8">
        <p className="t-label text-muted" data-reveal>
          <span className="text-signal">{index}</span>
          <span aria-hidden="true"> — </span>
          {label}
        </p>
        <h2 id={titleId} className="t-title mt-5 max-w-[18ch] text-ink" data-reveal style={{ "--i": 1 } as React.CSSProperties}>
          <span data-drift className="block">
            {title}
          </span>
        </h2>
      </div>
      {aside ? (
        <div className="col-span-4 md:col-span-2 lg:col-span-4 lg:justify-self-end" data-reveal style={{ "--i": 2 } as React.CSSProperties}>
          {aside}
        </div>
      ) : null}
    </header>
  );
}
