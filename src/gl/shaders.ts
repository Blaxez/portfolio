/**
 * GLSL ES 3.00 sources. One mesh program renders all five pipeline passes;
 * `uStage` selects the pass and a model-space scan plane wipes between them.
 */

export const MESH_VS = /* glsl */ `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNrm;

uniform mat4 uModel;
uniform mat4 uViewProj;
uniform mat4 uView;
uniform vec2 uShift;

out vec3 vWorldPos;
out vec3 vNormal;
out vec3 vBary;
out float vLocalY;
out float vViewZ;

void main() {
  vec4 wp = uModel * vec4(aPos, 1.0);
  vWorldPos = wp.xyz;
  vNormal = mat3(uModel) * aNrm;
  int k = gl_VertexID % 3;
  vBary = vec3(float(k == 0), float(k == 1), float(k == 2));
  vLocalY = aPos.y;
  vViewZ = -(uView * wp).z;
  vec4 cp = uViewProj * wp;
  cp.xy += uShift * cp.w;
  gl_Position = cp;
}
`;

export const MESH_FS = /* glsl */ `#version 300 es
precision highp float;

in vec3 vWorldPos;
in vec3 vNormal;
in vec3 vBary;
in float vLocalY;
in float vViewZ;

uniform float uStage;
uniform vec3 uCamPos;
uniform mat4 uView;
uniform vec3 uLightDir;
uniform vec2 uDepthRange;
uniform vec2 uLocalYRange;
uniform float uLineWidth;
uniform float uQuality;

out vec4 outColor;

const vec3 INK = vec3(0.929, 0.929, 0.918);        // #EDEDEA, sRGB (display-space passes)
const vec3 SIGNAL = vec3(0.776, 1.0, 0.239);       // #C6FF3D, sRGB
const vec3 SIGNAL_LIN = vec3(0.565, 1.0, 0.047);   // #C6FF3D, linear (lighting)
const vec3 ALBEDO = vec3(0.18);               // the 18% grey card
const float PI = 3.14159265;

float wire() {
  // Quad wireframe: the v0–v2 edge (bary.y == 0) is the patch-grid diagonal and is skipped.
  vec2 b = vec2(vBary.x, vBary.z);
  vec2 d = fwidth(b) * uLineWidth;
  vec2 a = smoothstep(vec2(0.0), d, b);
  return 1.0 - min(a.x, a.y);
}

// Procedural studio: overhead softbox, pointer-driven key strip, dim horizon, signal kicker.
vec3 environment(vec3 r, float rough) {
  vec3 c = mix(vec3(0.004), vec3(0.035), smoothstep(-0.3, 0.5, r.y));
  c += vec3(9.0) * smoothstep(0.88 - 0.35 * rough, 0.95 - 0.2 * rough, r.y);
  vec3 k = normalize(uLightDir + vec3(0.0, 0.25, 0.0));
  c += vec3(5.0) * pow(max(dot(r, k), 0.0), mix(600.0, 10.0, rough));
  float strip = smoothstep(0.1 + 0.25 * rough, 0.0, abs(r.x + 0.8)) * smoothstep(-0.2, 0.3, r.y) * smoothstep(0.3, -0.1, r.z);
  c += SIGNAL_LIN * 1.6 * strip;
  return c;
}

float D_GGX(float nh, float a) {
  float a2 = a * a;
  float d = nh * nh * (a2 - 1.0) + 1.0;
  return a2 / (PI * d * d);
}

float V_Smith(float nv, float nl, float a) {
  float k = a * 0.5;
  return 0.25 / ((nv * (1.0 - k) + k) * (nl * (1.0 - k) + k));
}

vec3 F_Schlick(float vh, vec3 f0) {
  return f0 + (1.0 - f0) * pow(1.0 - vh, 5.0);
}

vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

vec3 directLight(vec3 n, vec3 v, float rough) {
  vec3 l = normalize(uLightDir);
  vec3 h = normalize(l + v);
  float nl = max(dot(n, l), 0.0);
  float nv = max(dot(n, v), 1e-3);
  float nh = max(dot(n, h), 0.0);
  float a = rough * rough;
  vec3 f = F_Schlick(max(dot(v, h), 0.0), vec3(0.04));
  vec3 spec = D_GGX(nh, a) * V_Smith(nv, nl, a) * f;
  vec3 diff = (1.0 - f) * ALBEDO / PI;
  vec3 key = (diff + spec) * nl * 3.2;
  // Cool fill from the opposite side.
  vec3 lf = normalize(vec3(-l.x, 0.2, -l.z * 0.5 + 0.5));
  vec3 fill = ALBEDO / PI * max(dot(n, lf), 0.0) * vec3(0.35, 0.4, 0.5);
  return key + fill + ALBEDO * 0.02;
}

// Returns premultiplied RGBA for a pass.
vec4 pass(int mode, vec3 n, vec3 v) {
  if (mode == 0) {
    float w = wire();
    float a = 0.035 + 0.9 * w;
    return vec4(INK * a, a);
  }
  if (mode == 1) {
    vec3 vn = normalize(mat3(uView) * n);
    return vec4(vn * 0.5 + 0.5, 1.0);
  }
  if (mode == 2) {
    float d = clamp((vViewZ - uDepthRange.x) / (uDepthRange.y - uDepthRange.x), 0.0, 1.0);
    float g = pow(1.0 - d, 1.6);
    // Iso-depth contours every 1/6 unit, ~1px wide regardless of resolution.
    float f = abs(fract(vViewZ * 6.0) - 0.5) * 2.0;
    float band = smoothstep(1.0 - fwidth(vViewZ * 6.0) * 2.0, 1.0, f);
    return vec4(vec3(g) * (1.0 - band * 0.35), 1.0);
  }
  float rough = 0.32;
  vec3 lit = directLight(n, v, rough);
  if (mode == 3) {
    return vec4(pow(clamp(lit, 0.0, 1.0), vec3(1.0 / 2.2)), 1.0);
  }
  // Composite: glazed ceramic. Direct + diffuse/specular IBL + clear-coat, ACES, sRGB.
  float nv = max(dot(n, v), 1e-3);
  vec3 r = reflect(-v, n);
  vec3 f = F_Schlick(nv, vec3(0.04));
  vec3 irradiance = ALBEDO * (0.04 + 0.9 * smoothstep(-0.4, 1.0, n.y));
  vec3 color = lit + irradiance * (1.0 - f) + environment(r, rough) * f;
  if (uQuality > 0.5) {
    vec3 fc = F_Schlick(nv, vec3(0.04));
    color = color * (1.0 - fc) + environment(r, 0.04) * fc;
  }
  color = pow(aces(color), vec3(1.0 / 2.2));
  float dither = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
  color += dither / 255.0;
  return vec4(color, 1.0);
}

void main() {
  vec3 n = normalize(vNormal);
  if (!gl_FrontFacing) n = -n;
  vec3 v = normalize(uCamPos - vWorldPos);

  float s = clamp(uStage, 0.0, 4.0);
  float base = floor(s);
  float t = s - base;
  // Scan plane rises through the mesh in model space: below it the next pass is already written.
  float h = mix(uLocalYRange.x - 0.05, uLocalYRange.y + 0.05, t);
  int mode = int(base) + ((vLocalY < h && t > 0.0) ? 1 : 0);
  mode = min(mode, 4);
  vec4 c = pass(mode, n, v);

  if (t > 0.0 && t < 1.0) {
    float fw = fwidth(vLocalY);
    float line = 1.0 - smoothstep(fw * 0.5, fw * 2.0 + 0.004, abs(vLocalY - h));
    c = mix(c, vec4(SIGNAL, 1.0), line);
  }
  outColor = c;
}
`;

export const DEPTH_FS = /* glsl */ `#version 300 es
precision mediump float;
out vec4 outColor;
void main() { outColor = vec4(0.0); }
`;

export const CAGE_VS = /* glsl */ `#version 300 es
layout(location = 0) in vec3 aPos;
uniform mat4 uModel;
uniform mat4 uViewProj;
uniform vec2 uShift;
uniform float uPointSize;
void main() {
  vec4 cp = uViewProj * (uModel * vec4(aPos, 1.0));
  cp.xy += uShift * cp.w;
  gl_Position = cp;
  gl_PointSize = uPointSize;
}
`;

export const CAGE_FS = /* glsl */ `#version 300 es
precision mediump float;
uniform vec4 uColor;
out vec4 outColor;
void main() { outColor = vec4(uColor.rgb * uColor.a, uColor.a); }
`;
