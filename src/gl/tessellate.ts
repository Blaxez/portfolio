import { LID_END, LID_FIRST, TEAPOT_PATCHES, TEAPOT_POINTS } from "./teapot-data";

export interface TeapotMesh {
  /** Non-indexed triangle list, interleaved position(3) + normal(3). */
  vertices: Float32Array;
  vertexCount: number;
  triangles: number;
  /** Control cage as a line list, position(3). */
  cage: Float32Array;
  cageVertexCount: number;
  /** Unique control points, position(3). */
  points: Float32Array;
  pointCount: number;
  radius: number;
  minY: number;
  maxY: number;
}

const LID_FIT = 1.077;
const PATCHES = TEAPOT_PATCHES.length / 16;

function bernstein(t: number, out: Float64Array, d: Float64Array): void {
  const s = 1 - t;
  out[0] = s * s * s;
  out[1] = 3 * t * s * s;
  out[2] = 3 * t * t * s;
  out[3] = t * t * t;
  d[0] = -3 * s * s;
  d[1] = 3 * s * s - 6 * t * s;
  d[2] = 6 * t * s - 3 * t * t;
  d[3] = 3 * t * t;
}

/** Control point `index` of the source data, Z-up → Y-up, with the lid widened to close the seam. */
function controlPoint(index: number, lid: boolean, out: Float64Array, o: number): void {
  const k = index * 3;
  const fit = lid ? LID_FIT : 1;
  out[o] = TEAPOT_POINTS[k]! * fit;
  out[o + 1] = TEAPOT_POINTS[k + 2]!;
  out[o + 2] = -TEAPOT_POINTS[k + 1]! * fit;
}

/**
 * Tessellate Newell's teapot into `n × n` quads per bicubic patch.
 * Triangles are emitted so the quad diagonal is always the v0–v2 edge,
 * which lets the shader draw a quad wireframe from gl_VertexID alone.
 */
export function tessellateTeapot(n: number): TeapotMesh {
  const seg = Math.max(2, Math.floor(n));
  const side = seg + 1;
  const ctrl = new Float64Array(48);
  const bu = new Float64Array(4);
  const du = new Float64Array(4);
  const bv = new Float64Array(4);
  const dv = new Float64Array(4);
  const gridP = new Float64Array(side * side * 3);
  const gridN = new Float64Array(side * side * 3);
  const tmp = new Float64Array(9);

  const maxTris = PATCHES * seg * seg * 2;
  const verts = new Float32Array(maxTris * 3 * 6);
  let vc = 0;

  const evaluate = (u: number, v: number, pos: Float64Array | null, tan: Float64Array): void => {
    bernstein(u, bu, du);
    bernstein(v, bv, dv);
    let px = 0, py = 0, pz = 0, ux = 0, uy = 0, uz = 0, vx = 0, vy = 0, vz = 0;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const o = (r * 4 + c) * 3;
        const w = bu[r]! * bv[c]!;
        const wu = du[r]! * bv[c]!;
        const wv = bu[r]! * dv[c]!;
        const x = ctrl[o]!, y = ctrl[o + 1]!, z = ctrl[o + 2]!;
        px += w * x; py += w * y; pz += w * z;
        ux += wu * x; uy += wu * y; uz += wu * z;
        vx += wv * x; vy += wv * y; vz += wv * z;
      }
    }
    if (pos) {
      pos[0] = px; pos[1] = py; pos[2] = pz;
    }
    tan[0] = uy * vz - uz * vy;
    tan[1] = uz * vx - ux * vz;
    tan[2] = ux * vy - uy * vx;
  };

  const pos = new Float64Array(3);
  const nrm = new Float64Array(3);

  for (let p = 0; p < PATCHES; p++) {
    const lid = p >= LID_FIRST && p < LID_END;
    for (let i = 0; i < 16; i++) controlPoint(TEAPOT_PATCHES[p * 16 + i]!, lid, ctrl, i * 3);

    for (let iu = 0; iu <= seg; iu++) {
      for (let iv = 0; iv <= seg; iv++) {
        const u = iu / seg;
        const v = iv / seg;
        evaluate(u, v, pos, nrm);
        let len = Math.hypot(nrm[0]!, nrm[1]!, nrm[2]!);
        // Cusps (lid knob, base centre) have a vanishing derivative; sample just inside.
        let eps = 1e-3;
        while (len < 1e-9 && eps < 0.2) {
          evaluate(u < 0.5 ? u + eps : u - eps, v < 0.5 ? v + eps : v - eps, null, nrm);
          len = Math.hypot(nrm[0]!, nrm[1]!, nrm[2]!);
          eps *= 4;
        }
        const g = (iu * side + iv) * 3;
        gridP[g] = pos[0]!; gridP[g + 1] = pos[1]!; gridP[g + 2] = pos[2]!;
        const inv = len > 0 ? 1 / len : 0;
        gridN[g] = nrm[0]! * inv; gridN[g + 1] = nrm[1]! * inv; gridN[g + 2] = nrm[2]! * inv;
      }
    }

    const emit = (a: number, b: number, c: number): void => {
      const A = a * 3, B = b * 3, C = c * 3;
      const e1x = gridP[B]! - gridP[A]!, e1y = gridP[B + 1]! - gridP[A + 1]!, e1z = gridP[B + 2]! - gridP[A + 2]!;
      const e2x = gridP[C]! - gridP[A]!, e2y = gridP[C + 1]! - gridP[A + 1]!, e2z = gridP[C + 2]! - gridP[A + 2]!;
      tmp[0] = e1y * e2z - e1z * e2y;
      tmp[1] = e1z * e2x - e1x * e2z;
      tmp[2] = e1x * e2y - e1y * e2x;
      const area = Math.hypot(tmp[0]!, tmp[1]!, tmp[2]!);
      if (area < 1e-10) return; // degenerate at cusps
      const sx = gridN[A]! + gridN[B]! + gridN[C]!;
      const sy = gridN[A + 1]! + gridN[B + 1]! + gridN[C + 1]!;
      const sz = gridN[A + 2]! + gridN[B + 2]! + gridN[C + 2]!;
      // Keep winding consistent with the shading normal; swapping v0/v2 keeps the diagonal on v0–v2.
      const order = tmp[0]! * sx + tmp[1]! * sy + tmp[2]! * sz >= 0 ? [A, B, C] : [C, B, A];
      for (const k of order) {
        verts[vc++] = gridP[k]!; verts[vc++] = gridP[k + 1]!; verts[vc++] = gridP[k + 2]!;
        verts[vc++] = gridN[k]!; verts[vc++] = gridN[k + 1]!; verts[vc++] = gridN[k + 2]!;
      }
    };

    for (let iu = 0; iu < seg; iu++) {
      for (let iv = 0; iv < seg; iv++) {
        const p00 = iu * side + iv;
        const p10 = (iu + 1) * side + iv;
        const p11 = (iu + 1) * side + iv + 1;
        const p01 = iu * side + iv + 1;
        emit(p00, p10, p11);
        emit(p11, p01, p00);
      }
    }
  }

  const vertexCount = vc / 6;
  const vertices = verts.slice(0, vc);

  // Bounds → recentre on the origin.
  let minX = Infinity, minY = Infinity, minZ = Infinity, maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (let i = 0; i < vc; i += 6) {
    const x = vertices[i]!, y = vertices[i + 1]!, z = vertices[i + 2]!;
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
    if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
  }
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2, cz = (minZ + maxZ) / 2;
  let radius = 0;
  for (let i = 0; i < vc; i += 6) {
    vertices[i] = vertices[i]! - cx;
    vertices[i + 1] = vertices[i + 1]! - cy;
    vertices[i + 2] = vertices[i + 2]! - cz;
    const r = Math.hypot(vertices[i]!, vertices[i + 1]!, vertices[i + 2]!);
    if (r > radius) radius = r;
  }

  // Control cage (deduplicated edges) and unique control points.
  const edgeSeen = new Set<number>();
  const cageList: number[] = [];
  const pointSeen = new Set<number>();
  const pointList: number[] = [];
  const cp = new Float64Array(6);
  for (let p = 0; p < PATCHES; p++) {
    const lid = p >= LID_FIRST && p < LID_END;
    const idx = (r: number, c: number): number => TEAPOT_PATCHES[p * 16 + r * 4 + c]!;
    const push = (a: number, b: number): void => {
      if (a === b) return;
      const key = a < b ? a * 1024 + b : b * 1024 + a;
      if (edgeSeen.has(key)) return;
      edgeSeen.add(key);
      controlPoint(a, lid, cp, 0);
      controlPoint(b, lid, cp, 3);
      cageList.push(cp[0]! - cx, cp[1]! - cy, cp[2]! - cz, cp[3]! - cx, cp[4]! - cy, cp[5]! - cz);
    };
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (c < 3) push(idx(r, c), idx(r, c + 1));
        if (r < 3) push(idx(r, c), idx(r + 1, c));
        const id = idx(r, c);
        if (!pointSeen.has(id)) {
          pointSeen.add(id);
          controlPoint(id, lid, cp, 0);
          pointList.push(cp[0]! - cx, cp[1]! - cy, cp[2]! - cz);
        }
      }
    }
  }

  return {
    vertices,
    vertexCount,
    triangles: vertexCount / 3,
    cage: new Float32Array(cageList),
    cageVertexCount: cageList.length / 3,
    points: new Float32Array(pointList),
    pointCount: pointList.length / 3,
    radius,
    minY: minY - cy,
    maxY: maxY - cy,
  };
}
