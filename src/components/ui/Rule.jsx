/** A hairline the beam draws across on first view (animated by MotionDirector). */
export default function Rule({ className = "" }) {
  return (
    <div className={`rule ${className}`} data-rule aria-hidden="true">
      <span className="rule-fill" />
      <span className="beam-head" />
    </div>
  );
}
