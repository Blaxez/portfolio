(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,87610,e=>{"use strict";let t=`
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`,a=`
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform float uImgAspect;
uniform float uScan;
uniform float uTime;
uniform vec2 uMouse;
uniform float uLens;
uniform float uCell;
uniform vec3 uInk;
uniform vec3 uBone;
uniform vec3 uBeam;

float hash(float n) { return fract(sin(n) * 43758.5453); }

float bayer4(vec2 p) {
  p = mod(p, 4.0);
  float x = p.x, y = p.y;
  float v =
    (y < 1.0) ? ((x < 1.0) ? 0.0 : (x < 2.0) ? 8.0 : (x < 3.0) ? 2.0 : 10.0) :
    (y < 2.0) ? ((x < 1.0) ? 12.0 : (x < 2.0) ? 4.0 : (x < 3.0) ? 14.0 : 6.0) :
    (y < 3.0) ? ((x < 1.0) ? 3.0 : (x < 2.0) ? 11.0 : (x < 3.0) ? 1.0 : 9.0) :
                ((x < 1.0) ? 15.0 : (x < 2.0) ? 7.0 : (x < 3.0) ? 13.0 : 5.0);
  return (v + 0.5) / 16.0;
}

void main() {
  // object-fit: cover
  float boxAspect = uRes.x / uRes.y;
  vec2 uv = vUv;
  if (boxAspect > uImgAspect) {
    float s = uImgAspect / boxAspect;
    uv.y = (uv.y - 0.5) * s + 0.5;
  } else {
    float s = boxAspect / uImgAspect;
    uv.x = (uv.x - 0.5) * s + 0.5;
  }

  float scanY = 1.0 - uScan;          // the line travels top -> bottom
  float d = vUv.y - scanY;            // > 0: already scanned
  float band = exp(-abs(d) * 34.0);
  float row = floor(vUv.y * uRes.y / 3.0);
  uv.x += (hash(row + floor(uTime * 24.0)) - 0.5) * 0.035 * band;

  vec2 tuv = vec2(uv.x, 1.0 - uv.y);
  vec3 src = texture2D(uTex, tuv).rgb;
  float L = smoothstep(0.03, 0.97, dot(src, vec3(0.299, 0.587, 0.114)));
  // Strong, saturated red (the print on the hoodie) — skin and lips sit above 0.58 here.
  float mx = max(src.g, src.b);
  float red = (1.0 - smoothstep(0.42, 0.58, mx / max(src.r, 0.001)))
            * smoothstep(0.15, 0.3, src.r - mx)
            * smoothstep(0.25, 0.45, src.r);
  float vig = 1.0 - smoothstep(0.3, 0.95, length((vUv - vec2(0.5, 0.56)) * vec2(1.05, 0.95)) * 1.25);
  L *= mix(0.35, 1.0, vig);

  vec2 cell = floor(gl_FragCoord.xy / uCell);
  float dith = step(bayer4(cell), max(L * 0.96, red * 0.7));
  vec3 raw = mix(uInk, mix(uBone * 0.9, uBeam, red), dith);

  float g = hash(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + uTime) * 0.05 - 0.025;
  vec3 dev = mix(uInk, uBone, pow(L, 1.15)) + g;
  dev = mix(dev, uBeam * (0.55 + L * 0.6), red * 0.92);
  // Freshly scanned rows are still warm from the beam.
  dev = mix(dev, dev * (0.72 + uBeam * 0.45), exp(-max(d, 0.0) * 9.0) * step(0.0, d) * 0.45 * step(uScan, 0.999));

  vec2 px = vUv * uRes;
  float lens = uLens * (1.0 - smoothstep(uRes.x * 0.12, uRes.x * 0.2, distance(px, uMouse * uRes)));
  float developed = smoothstep(-0.0015, 0.0015, d) * (1.0 - lens);
  vec3 col = mix(raw, dev, developed);

  float active = step(0.0005, uScan) * step(uScan, 0.9995);
  float core = exp(-abs(d) * uRes.y * 0.75);
  float glow = exp(-abs(d) * 16.0) * 0.28;
  col += uBeam * (core * 1.4 + glow) * active;

  gl_FragColor = vec4(col, 1.0);
}`,r=e=>{let t=e.replace("#","").trim(),a=parseInt(3===t.length?t.replace(/(.)/g,"$1$1"):t,16);return[(a>>16&255)/255,(a>>8&255)/255,(255&a)/255]};function o(e,{src:n,ink:i="#0b0a09",bone:s="#ece6da",beam:u="#ff5b22",onReady:l}={}){let c=window.matchMedia("(prefers-reduced-motion: reduce)").matches,m=document.createElement("canvas");m.setAttribute("aria-hidden","true"),m.style.cssText="position:absolute;inset:0;width:100%;height:100%;display:block;opacity:0;transition:opacity .8s ease;";let v=m.getContext("webgl",{alpha:!1,antialias:!1,premultipliedAlpha:!1});if(!v)return null;e.appendChild(m);let d=(e,t)=>{let a=v.createShader(e);return v.shaderSource(a,t),v.compileShader(a),a},f=v.createProgram();if(v.attachShader(f,d(v.VERTEX_SHADER,t)),v.attachShader(f,d(v.FRAGMENT_SHADER,a)),v.linkProgram(f),!v.getProgramParameter(f,v.LINK_STATUS))return m.remove(),null;v.useProgram(f);let x=v.createBuffer();v.bindBuffer(v.ARRAY_BUFFER,x),v.bufferData(v.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),v.STATIC_DRAW);let h=v.getAttribLocation(f,"aPos");v.enableVertexAttribArray(h),v.vertexAttribPointer(h,2,v.FLOAT,!1,0,0);let p={};["uTex","uRes","uImgAspect","uScan","uTime","uMouse","uLens","uCell","uInk","uBone","uBeam"].forEach(e=>{p[e]=v.getUniformLocation(f,e)}),v.uniform1i(p.uTex,0),v.uniform3fv(p.uInk,r(i)),v.uniform3fv(p.uBone,r(s)),v.uniform3fv(p.uBeam,r(u));let g={scan:+!!c,targetScan:+!!c,lens:0,targetLens:0,mx:.5,my:.5,time:0},T=!1,E=!1,R=0,A=performance.now(),b=v.createTexture(),y=new Image;y.decoding="async",y.onload=()=>{v.bindTexture(v.TEXTURE_2D,b),v.pixelStorei(v.UNPACK_FLIP_Y_WEBGL,!1),v.texImage2D(v.TEXTURE_2D,0,v.RGB,v.RGB,v.UNSIGNED_BYTE,y),v.texParameteri(v.TEXTURE_2D,v.TEXTURE_MIN_FILTER,v.LINEAR),v.texParameteri(v.TEXTURE_2D,v.TEXTURE_MAG_FILTER,v.LINEAR),v.texParameteri(v.TEXTURE_2D,v.TEXTURE_WRAP_S,v.CLAMP_TO_EDGE),v.texParameteri(v.TEXTURE_2D,v.TEXTURE_WRAP_T,v.CLAMP_TO_EDGE),v.uniform1f(p.uImgAspect,y.naturalWidth/y.naturalHeight),T=!0,_(),L(),m.style.opacity="1",l?.(),w()},y.src=n;let _=()=>{let t=Math.min(window.devicePixelRatio||1,1.5),a=Math.max(1,Math.round(e.clientWidth*t)),r=Math.max(1,Math.round(e.clientHeight*t));(m.width!==a||m.height!==r)&&(m.width=a,m.height=r,v.viewport(0,0,a,r),v.uniform2f(p.uRes,a,r),v.uniform1f(p.uCell,Math.max(2,Math.round(2*t))),T&&L())},L=()=>{v.uniform1f(p.uScan,g.scan),v.uniform1f(p.uTime,g.time),v.uniform2f(p.uMouse,g.mx,g.my),v.uniform1f(p.uLens,g.lens),v.drawArrays(v.TRIANGLES,0,3)},S=e=>{R=0;let t=Math.min((e-A)/1e3,.05);A=e,g.time+=t;let a=1-Math.exp(-(7*t));g.scan+=(g.targetScan-g.scan)*a,g.lens+=(g.targetLens-g.lens)*(1-Math.exp(-(10*t))),L(),E&&(Math.abs(g.targetScan-g.scan)>5e-4||Math.abs(g.targetLens-g.lens)>.002||g.lens>.002||g.scan>5e-4&&g.scan<.9995)&&(R=requestAnimationFrame(S))};function w(){T&&E&&!R&&!c&&(A=performance.now(),R=requestAnimationFrame(S))}let I=new ResizeObserver(_);I.observe(e);let P=new IntersectionObserver(([e])=>{(E=e.isIntersecting)&&w()});P.observe(e);let U=t=>{if("touch"===t.pointerType)return;let a=e.getBoundingClientRect();g.mx=(t.clientX-a.left)/a.width,g.my=1-(t.clientY-a.top)/a.height,g.targetLens=1,w()},B=()=>{g.targetLens=0,w()};return e.addEventListener("pointermove",U),e.addEventListener("pointerleave",B),{setScan(e){c||(g.targetScan=Math.min(1,Math.max(0,e)),w())},destroy(){cancelAnimationFrame(R),I.disconnect(),P.disconnect(),e.removeEventListener("pointermove",U),e.removeEventListener("pointerleave",B),v.deleteTexture(b),v.deleteBuffer(x),v.deleteProgram(f),v.getExtension("WEBGL_lose_context")?.loseContext(),m.remove()}}}e.s(["mountPortraitScan",()=>o])}]);