import Rule from "./Rule";

/**
 * The one chapter header: a beam-drawn rule, a running line (index, label,
 * aside) and a sentence-case serif title whose italic word carries the stress.
 */
export default function SectionHeading({ index, label, aside, title, id, compact = false, className = "", children }) {
  return (
    <header className={`flex flex-col ${className}`}>
      <Rule />
      <div className="mt-4 flex items-baseline justify-between gap-6" data-reveal="up">
        <span className="flex items-baseline gap-4">
          <span className="index">({index})</span>
          <span className="label">{label}</span>
        </span>
        {aside ? <span className="label hidden md:block text-right">{aside}</span> : null}
      </div>
      <h2 id={id} className={`title ${compact ? "is-compact mt-[clamp(1rem,3.5vh,3rem)]" : "mt-10 md:mt-14"}`} data-split>
        {title}
      </h2>
      {children ? (
        <p className="lead mt-6 md:mt-8 max-w-xl" data-reveal="up">
          {children}
        </p>
      ) : null}
    </header>
  );
}
