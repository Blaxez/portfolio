import type { Project } from "@/content/projects";

const COL = 155;
const ROW = 140;
const W = 124;
const H = 44;
const X0 = 30;
const Y0 = 58;

const center = (col: number, row: number) => ({ x: X0 + col * COL + W / 2, y: Y0 + row * ROW + H / 2 });

/** Architecture diagram cover: hairline nodes, orthogonal edges that draw in on reveal. */
export default function Schematic({ project }: { project: Project }) {
  const { nodes, edges } = project.schematic;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const patternId = `grid-${project.slug}`;

  return (
    <svg viewBox="0 0 960 400" className="h-full w-full" role="img" aria-label={`Architecture: ${nodes.map((n) => n.label).join(", ")}`}>
      <defs>
        <pattern id={patternId} width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="var(--color-line)" />
        </pattern>
      </defs>
      <rect width="960" height="400" fill={`url(#${patternId})`} />
      <g fill="none" strokeWidth="1.25">
        {edges.map(([from, to], i) => {
          const a = byId.get(from);
          const b = byId.get(to);
          if (!a || !b) return null;
          const p = center(a.col, a.row);
          const q = center(b.col, b.row);
          const x1 = p.x + W / 2;
          const x2 = q.x - W / 2;
          const mid = (x1 + x2) / 2;
          const d = p.y === q.y ? `M${x1} ${p.y}H${x2}` : `M${x1} ${p.y}H${mid}V${q.y}H${x2}`;
          const hot = a.hot || b.hot;
          return (
            <path
              key={`${from}-${to}`}
              d={d}
              pathLength={1}
              className="schematic-edge"
              stroke={hot ? "var(--color-muted)" : "var(--color-line)"}
              style={{ "--i": i } as React.CSSProperties}
            />
          );
        })}
      </g>
      {nodes.map((node) => {
        const x = X0 + node.col * COL;
        const y = Y0 + node.row * ROW;
        return (
          <g key={node.id} className="schematic-node">
            <rect
              x={x}
              y={y}
              width={W}
              height={H}
              fill="var(--color-bg)"
              stroke={node.hot ? "var(--color-signal)" : "var(--color-muted)"}
              strokeWidth="1"
            />
            <text
              x={x + 12}
              y={y + H / 2 + 4}
              fill={node.hot ? "var(--color-signal)" : "var(--color-ink)"}
              fontFamily="var(--font-mono)"
              fontSize="12"
              letterSpacing="0.04em"
            >
              {node.label.toUpperCase()}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
