/** Minimal column-major mat4 helpers; allocation-free in the frame loop. */

export type Mat4 = Float32Array;

export const mat4 = (): Mat4 => new Float32Array(16);

export function perspective(out: Mat4, fovY: number, aspect: number, near: number, far: number): Mat4 {
  const f = 1 / Math.tan(fovY / 2);
  const nf = 1 / (near - far);
  out.fill(0);
  out[0] = f / aspect;
  out[5] = f;
  out[10] = (far + near) * nf;
  out[11] = -1;
  out[14] = 2 * far * near * nf;
  return out;
}

/** Camera on +Z looking at the origin. */
export function viewAt(out: Mat4, distance: number): Mat4 {
  out.fill(0);
  out[0] = 1;
  out[5] = 1;
  out[10] = 1;
  out[14] = -distance;
  out[15] = 1;
  return out;
}

/** Uniform scale, then yaw about Y, then pitch about X. */
export function modelMatrix(out: Mat4, yaw: number, pitch: number, scale: number): Mat4 {
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const cx = Math.cos(pitch), sx = Math.sin(pitch);
  // Rx * Ry, columns
  out[0] = cy * scale;
  out[1] = sx * sy * scale;
  out[2] = -cx * sy * scale;
  out[3] = 0;
  out[4] = 0;
  out[5] = cx * scale;
  out[6] = sx * scale;
  out[7] = 0;
  out[8] = sy * scale;
  out[9] = -sx * cy * scale;
  out[10] = cx * cy * scale;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}

export function multiply(out: Mat4, a: Mat4, b: Mat4): Mat4 {
  for (let c = 0; c < 4; c++) {
    const b0 = b[c * 4]!, b1 = b[c * 4 + 1]!, b2 = b[c * 4 + 2]!, b3 = b[c * 4 + 3]!;
    out[c * 4] = a[0]! * b0 + a[4]! * b1 + a[8]! * b2 + a[12]! * b3;
    out[c * 4 + 1] = a[1]! * b0 + a[5]! * b1 + a[9]! * b2 + a[13]! * b3;
    out[c * 4 + 2] = a[2]! * b0 + a[6]! * b1 + a[10]! * b2 + a[14]! * b3;
    out[c * 4 + 3] = a[3]! * b0 + a[7]! * b1 + a[11]! * b2 + a[15]! * b3;
  }
  return out;
}

/** Frame-rate independent exponential approach. */
export const damp = (current: number, target: number, rate: number, dt: number): number =>
  current + (target - current) * (1 - Math.exp(-rate * dt));
