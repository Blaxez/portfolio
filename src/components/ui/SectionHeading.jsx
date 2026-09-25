/**
 * The one section-header pattern used by every chapter:
 * mono index + eyebrow, big split-reveal title, optional intro copy.
 */
export default function SectionHeading({ index, eyebrow, title, id, align = "left", compact = false, className = "", children }) {
  const lines = Array.isArray(title) ? title : [title];
  const centered = align === "center";
  return (
    <header className={`${centered ? "text-center items-center" : ""} flex flex-col ${className}`}>
      <p className="eyebrow" data-reveal="up">
        <span aria-hidden="true">[ </span>
        {index} — {eyebrow}
        <span aria-hidden="true"> ]</span>
      </p>
      <h2 id={id} className={`section-title mt-5 ${compact ? "is-compact" : ""}`} data-split>
        {lines.map((line, i) => (
          <span key={i} className={`block ${i === lines.length - 1 && lines.length > 1 ? "text-[var(--acc)]" : ""}`}>
            {line}
            {i < lines.length - 1 ? " " : null}
          </span>
        ))}
      </h2>
      {children ? (
        <p
          className={`mt-6 max-w-xl text-base md:text-lg text-[var(--muted)] leading-relaxed ${centered ? "mx-auto" : ""}`}
          data-reveal="up"
        >
          {children}
        </p>
      ) : null}
    </header>
  );
}
