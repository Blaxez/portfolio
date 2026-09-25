// LaserBeam.js - ES module
// Export default class LaserBeam

const DEFAULTS = {
  start: { x: 0.5, y: 0.9 }, // normalized (0..1) relative to canvas
  end: { x: 0.5, y: 0.25 },
  color: [0.6, 0.8, 1.0],
  wispDensity: 1.0,
  flowSpeed: 0.35,
  vLenFactor: 6.0,
  hLenFactor: 1.0,
  fogIntensity: 0.45,
  fogScale: 0.3,
  wSpeed: 15.0,
  wIntensity: 5.0,
  flowStrength: 0.55,
  decay: 1.6,
  falloffStart: 1.2,
  fogFallSpeed: 0.6,
  fadeInDuration: 1.0,
  autoStart: true,
};

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

export default class LaserBeam {
  constructor(canvasOrSelector, cfg = {}) {
    this.config = Object.assign({}, DEFAULTS, cfg);

    // resolve canvas
    if (typeof canvasOrSelector === "string") {
      this.canvas = document.querySelector(canvasOrSelector);
      if (!this.canvas) {
        this.canvas = document.createElement("canvas");
        document.body.appendChild(this.canvas);
        this.canvas.style.position = "fixed";
        this.canvas.style.top = "0";
        this.canvas.style.left = "0";
        this.canvas.style.width = "100%";
        this.canvas.style.height = "100%";
        this.canvas.style.zIndex = "0";
        this.config.canvasProvided = false;
      } else {
        this.config.canvasProvided = true;
      }
    } else if (canvasOrSelector instanceof HTMLCanvasElement) {
      this.canvas = canvasOrSelector;
      this.config.canvasProvided = true;
    } else if (canvasOrSelector && canvasOrSelector.nodeType === 1) {
      this.canvas = canvasOrSelector;
      this.config.canvasProvided = true;
    } else {
      // create one and append
      this.canvas = document.createElement("canvas");
      document.body.appendChild(this.canvas);
      this.canvas.style.position = "fixed";
      this.canvas.style.top = "0";
      this.canvas.style.left = "0";
      this.canvas.style.width = "100%";
      this.canvas.style.height = "100%";
      this.canvas.style.zIndex = "0";
      this.config.canvasProvided = false;
    }

    this.gl = this.canvas.getContext("webgl", { antialias: false });
    if (!this.gl) throw new Error("WebGL not supported");

    // try extension
    this.ext = this.gl.getExtension("OES_standard_derivatives");

    this._initTime();
    this._makeShaders();
    this._makeBuffers();
    this._lookupUniforms();
    this._setUniformDefaults();

    this._attachEvents();
    this.resize();

    this._running = false;
    if (this.config.autoStart) this.start();
  }

  _initTime() {
    this._startTime = performance.now();
    this._lastTime = 0;
    this._flowTime = 0;
    this._fogTime = 0;
    this._fade = 0;
  }

  _makeShaders() {
    const gl = this.gl;

    const vertexShaderSource = `precision highp float; attribute vec3 position; void main(){ gl_Position = vec4(position,1.0); }`;

    const fragmentShaderSource = `
#ifdef GL_ES
#extension GL_OES_standard_derivatives : enable
#endif
precision highp float;
precision mediump int;

uniform float iTime;
uniform vec3 iResolution;
uniform vec4 iMouse;

uniform vec2 uBeamStartPx; // pixels
uniform vec2 uBeamEndPx;   // pixels

uniform float uWispDensity;
uniform float uFlowTime;
uniform float uFogTime;
uniform float uFlowSpeed;
uniform float uVLenFactor;
uniform float uHLenFactor;
uniform float uFogIntensity;
uniform float uFogScale;
uniform float uWSpeed;
uniform float uWIntensity;
uniform float uFlowStrength;
uniform float uDecay;
uniform float uFalloffStart;
uniform float uFogFallSpeed;
uniform vec3 uColor;
uniform float uFade;
uniform float uRectTopYPx;
uniform float uRectHalfWidthPx;
uniform float uRectHeightPx;
uniform float uRectBottomYPx;
uniform float uRectCenterXPx;

#define PI 3.14159265359
#define TWO_PI 6.28318530718
#define EPS 1e-6
#define EDGE_SOFT (DT_LOCAL*4.0)
#define DT_LOCAL 0.0038
#define TAP_RADIUS 6
#define R_H 150.0
#define R_V 150.0
#define FLARE_HEIGHT 16.0
#define FLARE_AMOUNT 8.0
#define FLARE_EXP 2.0
#define TOP_FADE_START 0.1
#define TOP_FADE_EXP 1.0
#define FLOW_PERIOD 0.5
#define FLOW_SHARPNESS 1.5

#define W_BASE_X 1.5
#define W_LAYER_GAP 0.25
#define W_LANES 10
#define W_SIDE_DECAY 0.5
#define W_HALF 0.01
#define W_AA 0.15
#define W_CELL 20.0
#define W_SEG_MIN 0.01
#define W_SEG_MAX 0.55
#define W_CURVE_AMOUNT 15.0
#define W_CURVE_RANGE (FLARE_HEIGHT - 3.0)
#define W_BOTTOM_EXP 10.0

#define FOG_ON 1
#define FOG_CONTRAST 1.2
#define FOG_OCTAVES 5
#define FOG_BOTTOM_BIAS 0.8
#define FOG_BEAM_MIN 0.0
#define FOG_BEAM_MAX 0.75
#define FOG_MASK_GAMMA 0.5
#define FOG_EXPAND_SHAPE 12.2
#define FOG_EDGE_MIX 0.5

#define HFOG_EDGE_START 0.20
#define HFOG_EDGE_END 0.98
#define HFOG_EDGE_GAMMA 1.4
#define HFOG_Y_RADIUS 25.0
#define HFOG_Y_SOFT 60.0

#define EDGE_X0 0.22
#define EDGE_X1 0.995
#define EDGE_X_GAMMA 1.25
#define EDGE_LUMA_T0 0.0
#define EDGE_LUMA_T1 2.0
#define DITHER_STRENGTH 1.0

float g(float x){return x<=0.00031308?12.92*x:1.055*pow(x,1.0/2.4)-0.055;}
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+34.123);return fract(p.x*p.y);} 
float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);float a=h21(i),b=h21(i+vec2(1,0)),c=h21(i+vec2(0,1)),d=h21(i+vec2(1,1));vec2 u=f*f*(3.0-2.0*f);return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);} 
float fbm2(vec2 p){float v=0.0,amp=0.6; mat2 m=mat2(0.86,0.5,-0.5,0.86); for(int i=0;i<FOG_OCTAVES;++i){v+=amp*vnoise(p); p=m*p*2.03+17.1; amp*=0.52;} return v;} 
float tri01(float x){float f=fract(x);return 1.0-abs(f*2.0-1.0);} 
float rGate(float x,float l){float a=smoothstep(0.0,W_AA,x),b=1.0-smoothstep(l,l+W_AA,x);return max(0.0,a*b);} 
float flareY(float y){float t=clamp(1.0-(clamp(y,0.0,FLARE_HEIGHT)/max(FLARE_HEIGHT,EPS)),0.0,1.0);return pow(t,FLARE_EXP);} 

float bs(vec2 p,vec2 q,float powr){float d=distance(p,q),f=powr*uFalloffStart,r=(f*f)/(d*d+EPS);return powr*min(1.0,r);} 
float bsa(vec2 p,vec2 q,float powr,vec2 s){vec2 d=p-q; float dd=(d.x*d.x)/(s.x*s.x)+(d.y*d.y)/(s.y*s.y),f=powr*uFalloffStart,r=(f*f)/(dd+EPS);return powr*min(1.0,r);} 

float vWisps(vec2 uv,float topF){float y=uv.y,yf=(y+uFlowTime*uWSpeed)/W_CELL; float dRaw=clamp(uWispDensity,0.0,2.0),d=dRaw<=0.0?1.0:dRaw; float lanesF=floor(float(W_LANES)*min(d,1.0)+0.5); int lanes=int(max(1.0,lanesF)); float sp=min(d,1.0),ep=max(d-1.0,0.0); float fm=flareY(max(y,0.0)),rm=clamp(1.0-(y/max(W_CURVE_RANGE,EPS)),0.0,1.0),cm=fm*rm; const float G=0.05; float xS=1.0+(FLARE_AMOUNT*W_CURVE_AMOUNT*G)*cm; float sPix=clamp(y/(R_V*uVLenFactor),0.0,1.0),bGain=pow(1.0-sPix,W_BOTTOM_EXP),sum=0.0; for(int s=0;s<2;++s){float sgn=s==0?-1.0:1.0; for(int i=0;i<W_LANES;++i){ if(i>=lanes) break; float off=W_BASE_X+float(i)*W_LAYER_GAP,xc=sgn*(off*xS); float dx=abs(uv.x-xc),lat=1.0-smoothstep(W_HALF,W_HALF+W_AA,dx),amp=exp(-off*W_SIDE_DECAY); float seed=h21(vec2(off,sgn*17.0)),yf2=yf+seed*7.0,ci=floor(yf2),fy=fract(yf2); float seg=mix(W_SEG_MIN,W_SEG_MAX,h21(vec2(ci,off*2.3))); float spR=h21(vec2(ci,off+sgn*31.0)),seg1=rGate(fy,seg)*step(spR,sp); if(ep>0.0){float spR2=h21(vec2(ci*3.1+7.0,off*5.3+sgn*13.0)); float f2=fract(fy+0.5); seg1+=rGate(f2,seg*0.9)*step(spR2,ep);} sum+=amp*lat*seg1; }} float span=smoothstep(-3.0,0.0,y)*(1.0-smoothstep(R_V-6.0,R_V,y)); return uWIntensity*sum*topF*bGain*span; }

void main(){
  vec2 frag = gl_FragCoord.xy;
  vec2 res = iResolution.xy;

  // Beam coordinate transform: convert fragment pos to beam-local coordinates
  vec2 startP = uBeamStartPx;
  vec2 endP = uBeamEndPx;
  vec2 mid = 0.5*(startP + endP);
  vec2 dir = endP - startP;
  float len = length(dir) + 1e-6;
  vec2 ndir = dir / len;
  vec2 nperp = vec2(-ndir.y, ndir.x);

  vec2 rel = frag - mid; // pixels
  float x_pix = dot(rel, nperp);
  float y_pix = dot(rel, ndir);

  float sc = 512.0 / res.x * 0.4;
  vec2 uv = vec2(x_pix, y_pix) * sc; // beam-local scaled coords

  // convert to uvc used by original shader
  vec2 uvc = uv;

  // Apply spread when hitting the target rectangle
  float spreadFactor = 0.0;
  if (uRectTopYPx > 0.0) { // Check if a target rectangle is active
    float beamBottomY = frag.y; // Current fragment's Y position
    float rectTop = uRectTopYPx;
    float rectBottom = uRectBottomYPx;
    float rectHalfWidth = uRectHalfWidthPx;
    float rectCenter = uRectCenterXPx;

    // Calculate how much the beam has penetrated the rectangle
    float penetration = max(0.0, rectTop - beamBottomY);
    float maxPenetration = uRectHeightPx; // Max possible penetration is the rectangle's height

    // Only apply spread if the beam is within the vertical bounds of the rectangle
    if (beamBottomY <= rectTop && beamBottomY >= rectBottom) {
      // Calculate a spread based on distance from center and penetration
      float distFromCenter = abs(frag.x - rectCenter);
      float normalizedDistFromCenter = distFromCenter / rectHalfWidth;
      
      // A simple spread model: more spread closer to the center, and more spread with deeper penetration
      spreadFactor = smoothstep(0.0, 1.0, penetration / maxPenetration) * (1.0 - normalizedDistFromCenter);
      spreadFactor = pow(spreadFactor, 2.0); // Exaggerate the spread effect
      
      // Introduce vertical flow
      float flowAmount = penetration * 0.2 + sin(iTime * 8.0 + frag.x * 0.1) * 0.1 * smoothstep(0.0, 0.5, penetration / maxPenetration);
      uvc.y -= flowAmount;

               float dirX = sign(frag.x - rectCenter);
               uvc.x += dirX * spreadFactor * (R_H * uHLenFactor) * (0.5 + 0.5 * smoothstep(0.0, 0.5, penetration / maxPenetration));
    }
  }

  float a = 0.0;
  float b = 0.0;
  float basePhase = 1.5 * PI + uDecay * 0.5;
  float tauMin = basePhase - uDecay;
  float tauMax = basePhase;

  float cx = clamp(uvc.x / (R_H * uHLenFactor), -1.0, 1.0);
  float tH = clamp(TWO_PI - acos(cx), tauMin, tauMax);
  for(int k=-TAP_RADIUS;k<=TAP_RADIUS;++k){
    float tu = tH + float(k) * DT_LOCAL;
    float aW = smoothstep(tauMin, tauMin + EDGE_SOFT, tu) * (1.0 - smoothstep(tauMax - EDGE_SOFT, tauMax, tu));
    if(aW <= 0.0) continue;
    float spd = max(abs(sin(tu)), 0.02);
    float u = clamp((basePhase - tu) / max(uDecay, EPS), 0.0, 1.0);
    float env = pow(1.0 - abs(u * 2.0 - 1.0), 0.8);
    vec2 p = vec2((R_H * uHLenFactor) * cos(tu), 0.0);
    a += aW * bs(uvc, p, env * spd);
  }

  float cy = clamp(-uvc.y / (R_V * uVLenFactor), -1.0, 1.0);
  float tV = clamp(TWO_PI - acos(cy), tauMin, tauMax);
  for(int k=-TAP_RADIUS;k<=TAP_RADIUS;++k){
    float tu = tV + float(k) * DT_LOCAL;
    float aW = smoothstep(tauMin, tauMin + EDGE_SOFT, tu) * (1.0 - smoothstep(tauMax - EDGE_SOFT, tauMax, tu));
    if(aW <= 0.0) continue;
    float yb = (-R_V) * cos(tu);
    float s = clamp(yb / R_V, 0.0, 1.0);
    float spd = max(abs(sin(tu)), 0.02);
    float env = pow(1.0 - s, 0.6) * spd;
    float cap = 1.0 - smoothstep(TOP_FADE_START, 1.0, s);
    cap = pow(cap, TOP_FADE_EXP);
    env *= cap;
    float ph = s / max(FLOW_PERIOD, EPS) + uFlowTime * uFlowSpeed;
    float fl = pow(tri01(ph), FLOW_SHARPNESS);
    env *= mix(1.0 - uFlowStrength, 1.0, fl);
    float yp = (-R_V * uVLenFactor) * cos(tu);
    float m = pow(smoothstep(FLARE_HEIGHT, 0.0, yp), FLARE_EXP);
    float wx = 1.0 + FLARE_AMOUNT * m;
    vec2 sig = vec2(wx, 1.0);
    vec2 p = vec2(0.0, yp);
    float mask = step(0.0, yp);
    b += aW * bsa(uvc, p, mask * env, sig);
  }

  float sPix = clamp(uvc.y / (R_V * uVLenFactor), 0.0, 1.0);
  float topA = pow(1.0 - smoothstep(TOP_FADE_START, 1.0, sPix), TOP_FADE_EXP);
  float L = a + b * topA;
  float w = vWisps(vec2(uvc.x, uvc.y), topA);

  // fog
  float fog = 0.0;
#if FOG_ON
  vec2 fuv = uvc * uFogScale;
  vec2 fogDir = normalize(vec2(0.0,1.0));
  fuv += uFogTime * uFogFallSpeed * fogDir;
  vec2 prp = vec2(-fogDir.y, fogDir.x);
  fuv += prp * (0.08 * sin(dot(uvc, prp) * 0.08 + uFogTime * 0.9));
  float n = fbm2(fuv + vec2(fbm2(fuv + vec2(7.3, 2.1)), fbm2(fuv + vec2(-3.7, 5.9))) * 0.6);
  n = pow(clamp(n, 0.0, 1.0), FOG_CONTRAST);
  float pixW = 1.0 / max(iResolution.y, 1.0);
#ifdef GL_OES_standard_derivatives
  float wL = max(fwidth(L), pixW);
#else
  float wL = pixW;
#endif
  float m0 = pow(smoothstep(FOG_BEAM_MIN - wL, FOG_BEAM_MAX + wL, L), FOG_MASK_GAMMA);
  float bm = 1.0 - pow(1.0 - m0, FOG_EXPAND_SHAPE);
  bm = mix(bm * m0, bm, FOG_EDGE_MIX);
  float yP = 1.0 - smoothstep(HFOG_Y_RADIUS, HFOG_Y_RADIUS + HFOG_Y_SOFT, abs(uvc.y));
  float nxF = abs((frag.x - res.x * 0.5) / max(res.x * 0.5, 1.0));
  float hE = 1.0 - smoothstep(HFOG_EDGE_START, HFOG_EDGE_END, nxF);
  hE = pow(clamp(hE, 0.0, 1.0), HFOG_EDGE_GAMMA);
  float hW = mix(1.0, hE, clamp(yP, 0.0, 1.0));
  float bBias = mix(1.0, 1.0 - sPix, FOG_BOTTOM_BIAS);
  float browserFogIntensity = uFogIntensity * 1.8;
  float radialFade = 1.0 - smoothstep(0.0, 0.7, length(uvc) / 120.0);
  float safariFog = n * browserFogIntensity * bBias * bm * hW * radialFade;
  fog = safariFog;
#endif

  float LF = L + fog;
  float dith = (h21(frag) - 0.5) * (DITHER_STRENGTH / 255.0);
  float tone = g(LF + w);
  vec3 col = tone * uColor + dith;
  float alpha = clamp(g(L + w * 0.6) + dith * 0.6, 0.0, 1.0);
  float nxE = abs((frag.x - res.x * 0.5) / max(res.x * 0.5, 1.0));
  float xF = pow(clamp(1.0 - smoothstep(EDGE_X0, EDGE_X1, nxE), 0.0, 1.0), EDGE_X_GAMMA);
  float scene = LF + max(0.0, w) * 0.5;
  float hi = smoothstep(EDGE_LUMA_T0, EDGE_LUMA_T1, scene);
  float eM = mix(xF, 1.0, hi);
  col *= eM; alpha *= eM;
  col *= uFade; alpha *= uFade;

  gl_FragColor = vec4(col, 1.0);
}
`;

    const vs = this._compileShader(vertexShaderSource, gl.VERTEX_SHADER);
    const fs = this._compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);

    this.program = gl.createProgram();
    gl.attachShader(this.program, vs);
    gl.attachShader(this.program, fs);
    gl.linkProgram(this.program);
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      console.error("Program link error", gl.getProgramInfoLog(this.program));
    }
    gl.useProgram(this.program);
  }

  _compileShader(src, type) {
    const gl = this.gl;
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error("Shader compile error", gl.getShaderInfoLog(sh));
      throw new Error("Shader compile failure");
    }
    return sh;
  }

  _makeBuffers() {
    const gl = this.gl;
    const positions = new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]);
    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(this.program, "position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
  }

  _lookupUniforms() {
    const gl = this.gl;
    const p = this.program;
    this.uniforms = {
      iTime: gl.getUniformLocation(p, "iTime"),
      iResolution: gl.getUniformLocation(p, "iResolution"),
      iMouse: gl.getUniformLocation(p, "iMouse"),
      uBeamStartPx: gl.getUniformLocation(p, "uBeamStartPx"),
      uBeamEndPx: gl.getUniformLocation(p, "uBeamEndPx"),
      uWispDensity: gl.getUniformLocation(p, "uWispDensity"),
      uFlowTime: gl.getUniformLocation(p, "uFlowTime"),
      uFogTime: gl.getUniformLocation(p, "uFogTime"),
      uFlowSpeed: gl.getUniformLocation(p, "uFlowSpeed"),
      uVLenFactor: gl.getUniformLocation(p, "uVLenFactor"),
      uHLenFactor: gl.getUniformLocation(p, "uHLenFactor"),
      uFogIntensity: gl.getUniformLocation(p, "uFogIntensity"),
      uFogScale: gl.getUniformLocation(p, "uFogScale"),
      uWSpeed: gl.getUniformLocation(p, "uWSpeed"),
      uWIntensity: gl.getUniformLocation(p, "uWIntensity"),
      uFlowStrength: gl.getUniformLocation(p, "uFlowStrength"),
      uDecay: gl.getUniformLocation(p, "uDecay"),
      uFalloffStart: gl.getUniformLocation(p, "uFalloffStart"),
      uFogFallSpeed: gl.getUniformLocation(p, "uFogFallSpeed"),
      uColor: gl.getUniformLocation(p, "uColor"),
      uFade: gl.getUniformLocation(p, "uFade"),
      uRectTopYPx: gl.getUniformLocation(p, "uRectTopYPx"),
      uRectHalfWidthPx: gl.getUniformLocation(p, "uRectHalfWidthPx"),
      uRectHeightPx: gl.getUniformLocation(p, "uRectHeightPx"),
      uRectBottomYPx: gl.getUniformLocation(p, "uRectBottomYPx"),
      uRectCenterXPx: gl.getUniformLocation(p, "uRectCenterXPx"),
    };
  }

  _setUniformDefaults() {
    const gl = this.gl,
      u = this.uniforms,
      c = this.config;
    gl.uniform1f(u.uWispDensity, c.wispDensity);
    gl.uniform1f(u.uFlowSpeed, c.flowSpeed);
    gl.uniform1f(u.uVLenFactor, c.vLenFactor);
    gl.uniform1f(u.uHLenFactor, c.hLenFactor);
    gl.uniform1f(u.uFogIntensity, c.fogIntensity);
    gl.uniform1f(u.uFogScale, c.fogScale);
    gl.uniform1f(u.uWSpeed, c.wSpeed);
    gl.uniform1f(u.uWIntensity, c.wIntensity);
    gl.uniform1f(u.uFlowStrength, c.flowStrength);
    gl.uniform1f(u.uDecay, c.decay);
    gl.uniform1f(u.uFalloffStart, c.falloffStart);
    gl.uniform1f(u.uFogFallSpeed, c.fogFallSpeed);
    gl.uniform3f(u.uColor, c.color[0], c.color[1], c.color[2]);
    gl.uniform1f(u.uFade, 0.0);
    // rect defaults
    gl.uniform1f(u.uRectTopYPx, 0.0);
    gl.uniform1f(u.uRectHalfWidthPx, 0.0);
    gl.uniform1f(u.uRectHeightPx, 0.0);
    gl.uniform1f(u.uRectBottomYPx, 0.0);
    gl.uniform1f(u.uRectCenterXPx, 0.0);
  }

  _attachEvents() {
    this._onResize = this.resize.bind(this);
    window.addEventListener("resize", this._onResize);
  }

  resize() {
    const canvas = this.canvas;
    const gl = this.gl;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    gl.viewport(0, 0, canvas.width, canvas.height);
    // update resolution uniform
    gl.useProgram(this.program);
    gl.uniform3f(this.uniforms.iResolution, canvas.width, canvas.height, 1.0);
    // update beam positions to pixels (from normalized config)
    if (this.config.target) this._syncTargetRect();
    this._updateBeamPx();
  }

  _updateBeamPx() {
    // config.start/end can be pixels or normalized
    const c = this.config,
      canvas = this.canvas;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const toPx = (v, axis) => {
      if (typeof v === "number") return axis === "x" ? v * dpr : v * dpr;
      if (v && typeof v.x === "number" && typeof v.y === "number") return v;
      return null;
    };
    // accept normalized {x:0..1, y:0..1} or pixel {x:, y:}
    const start = this.config.start;
    const end = this.config.end;
    let sPx = { x: start.x, y: start.y };
    let ePx = { x: end.x, y: end.y };

    if (start.x <= 1.01 && start.y <= 1.01) {
      sPx = {
        x: Math.round(start.x * canvas.width),
        y: Math.round(start.y * canvas.height),
      };
    }

    if (end.x <= 1.01) {
      ePx.x = Math.round(end.x * canvas.width);
    }

    // Collision detection with target rectangle
    if (this.config.target) {
      let el = null;
      const t = this.config.target;
      if (typeof t === "string") el = document.querySelector(t);
      else if (t instanceof Element) el = t;
      if (el) {
        const rect = el.getBoundingClientRect();
        const rectLeftPx = rect.left * dpr;
        const rectRightPx = rect.right * dpr;
        const rectTopPx = rect.top * dpr;
        const rectBottomPx = rect.bottom * dpr;

        const sx = sPx.x,
          sy = sPx.y;
        const ex = end.x <= 1.01 ? Math.round(end.x * canvas.width) : ePx.x;
        const ey = end.y <= 1.01 ? Math.round(end.y * canvas.height) : ePx.y;

        // Parametric line: P(t) = S + t*(E-S), t in [0,1]
        let bestT = Infinity;
        let hitX = ePx.x;
        let hitY = ePx.y;

        const dx = ex - sx;
        const dy = ey - sy;

        // Intersect with top edge (y = rectTopPx)
        if (Math.abs(dy) > 1e-6) {
          const tTop = (rectTopPx - sy) / dy;
          if (tTop >= 0.0 && tTop <= 1.0) {
            const ix = sx + dx * tTop;
            if (ix >= rectLeftPx && ix <= rectRightPx) {
              bestT = tTop;
              hitX = ix;
              hitY = rectTopPx;
            }
          }
        }

        // Intersect with left edge (x = rectLeftPx)
        if (Math.abs(dx) > 1e-6) {
          const tLeft = (rectLeftPx - sx) / dx;
          if (tLeft >= 0.0 && tLeft <= 1.0) {
            const iy = sy + dy * tLeft;
            if (iy >= rectTopPx && iy <= rectBottomPx) {
              if (tLeft < bestT) {
                bestT = tLeft;
                hitX = rectLeftPx;
                hitY = iy;
              }
            }
          }
        }

        // Intersect with right edge (x = rectRightPx)
        if (Math.abs(dx) > 1e-6) {
          const tRight = (rectRightPx - sx) / dx;
          if (tRight >= 0.0 && tRight <= 1.0) {
            const iy = sy + dy * tRight;
            if (iy >= rectTopPx && iy <= rectBottomPx) {
              if (tRight < bestT) {
                bestT = tRight;
                hitX = rectRightPx;
                hitY = iy;
              }
            }
          }
        }

        if (bestT !== Infinity) {
          ePx.x = Math.round(hitX);
          ePx.y = Math.round(hitY);
        } else if (end.y <= 1.01) {
          ePx.y = Math.round(end.y * canvas.height);
        }
      } else if (end.y <= 1.01) {
        ePx.y = Math.round(end.y * canvas.height);
      }
    } else if (end.y <= 1.01) {
      ePx.y = Math.round(end.y * canvas.height);
    }
    this._beamStartPx = sPx;
    this._beamEndPx = ePx;
    // push to shader
    this.gl.useProgram(this.program);
    this.gl.uniform2f(this.uniforms.uBeamStartPx, sPx.x, sPx.y);
    this.gl.uniform2f(this.uniforms.uBeamEndPx, ePx.x, ePx.y);
  }

  start() {
    if (this._running) return;
    this._running = true;
    this._then = performance.now();
    this._raf = requestAnimationFrame(this._tick.bind(this));
  }

  stop() {
    this._running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
  }

  _tick(now) {
    if (!this._running) return;
    const elapsed = (now - this._startTime) / 1000;
    const dt = clamp(elapsed - this._lastTime, 0.0001, 0.033);
    this._lastTime = elapsed;
    // time accumulators
    this._flowTime += dt;
    this._fogTime += dt;
    // fade in
    this._fade = Math.min(1.0, this._fade + dt / this.config.fadeInDuration);
    // update uniforms
    const gl = this.gl,
      u = this.uniforms;
    gl.useProgram(this.program);
    gl.uniform1f(u.iTime, elapsed);
    gl.uniform4f(u.iMouse, 0.0, 0.0, 0.0, 0.0);
    gl.uniform1f(u.uFlowTime, this._flowTime);
    gl.uniform1f(u.uFogTime, this._fogTime);
    gl.uniform1f(u.uFade, this._fade);
    // update rect mask if a target element was given
    if (this.config.target) this._syncTargetRect();

    // draw
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    this._raf = requestAnimationFrame(this._tick.bind(this));
  }

  _syncTargetRect() {
    // if user provided CSS selector or element, compute top Y in GL pixels and half width
    const t = this.config.target;
    let el = null;
    if (typeof t === "string") el = document.querySelector(t);
    else if (t instanceof Element) el = t;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rectTopYPxGL = this.canvas.height - rect.top * dpr;
    const rectHeightPx = rect.height * dpr;
    const rectBottomYPx = this.canvas.height - rect.bottom * dpr;
    const rectHalfWidthPx = rect.width * dpr * 0.5;
    const rectCenterXPx = rect.left * dpr + rectHalfWidthPx;
    this.gl.useProgram(this.program);
    this.gl.uniform1f(this.uniforms.uRectTopYPx, rectTopYPxGL);
    this.gl.uniform1f(this.uniforms.uRectHeightPx, rectHeightPx);
    this.gl.uniform1f(this.uniforms.uRectBottomYPx, rectBottomYPx);
    this.gl.uniform1f(this.uniforms.uRectHalfWidthPx, rectHalfWidthPx);
    this.gl.uniform1f(this.uniforms.uRectCenterXPx, rectCenterXPx);
  }

  setStart(x, y) {
    this.config.start = { x, y };
    this._updateBeamPx();
  }
  setEnd(x, y) {
    this.config.end = { x, y };
    this._updateBeamPx();
  }
  setColor(r, g, b) {
    this.config.color = [r, g, b];
    this.gl.useProgram(this.program);
    this.gl.uniform3f(this.uniforms.uColor, r, g, b);
  }

  setTargetElement(el) {
    this.config.target = el;
  }

  destroy() {
    this.stop();
    window.removeEventListener("resize", this._onResize);
    // delete GL resources
    try {
      const gl = this.gl;
      if (this.positionBuffer) gl.deleteBuffer(this.positionBuffer);
      if (this.program) gl.deleteProgram(this.program);
    } catch (e) {}
    // remove canvas if we created it
    if (!this.config.canvasProvided && this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}
