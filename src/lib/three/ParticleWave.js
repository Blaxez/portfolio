import { createStage, SNOISE } from "./stage";

/**
 * Particle terrain for the Contact section: a grid of points riding layered
 * waves, with ripples emitted from the pointer's position on the surface.
 */
export function mountParticleWave(container, { colorA = "#60a5fa", colorB = "#818cf8", light = false } = {}) {
  let material;
  const mouse = { ndc: null, strength: 0 };
  let raycaster;
  let plane;
  let hit;

  const stage = createStage(container, {
    fov: 50,
    z: 7,
    onFrame: ({ t, dt }) => {
      const u = material.uniforms;
      u.uTime.value = t;
      u.uMouseStrength.value += ((mouse.ndc ? 1 : 0) - u.uMouseStrength.value) * Math.min(1, dt * 3);
      if (mouse.ndc) {
        raycaster.setFromCamera(mouse.ndc, stage.camera);
        if (raycaster.ray.intersectPlane(plane, hit)) u.uMouse.value.lerp(new stage.THREE.Vector2(hit.x, hit.z), Math.min(1, dt * 6));
      }
    },
  });
  const { THREE, scene, camera, isMobile } = stage;
  camera.position.set(0, 2.4, 7);
  camera.lookAt(0, -0.4, -1);

  const cols = isMobile ? 90 : 170;
  const rows = isMobile ? 50 : 90;
  const width = 22;
  const depth = 14;
  const positions = new Float32Array(cols * rows * 3);
  let k = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      positions[k++] = (c / (cols - 1) - 0.5) * width;
      positions[k++] = 0;
      positions[k++] = (r / (rows - 1) - 0.75) * depth;
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: light ? THREE.NormalBlending : THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uMouseStrength: { value: 0 },
      uColorA: { value: new THREE.Color(colorA) },
      uColorB: { value: new THREE.Color(colorB) },
      uPx: { value: stage.renderer.getPixelRatio() },
      uAlpha: { value: light ? 0.9 : 0.75 },
    },
    vertexShader: /* glsl */ `
      uniform float uTime; uniform vec2 uMouse; uniform float uMouseStrength; uniform float uPx;
      varying float vH; varying float vFade;
      ${SNOISE}
      void main() {
        vec3 p = position;
        float h = sin(p.x * 0.55 + uTime * 0.8) * 0.28 + sin(p.z * 0.75 + uTime * 1.1) * 0.22;
        h += snoise(vec3(p.x * 0.18, p.z * 0.22, uTime * 0.12)) * 0.55;
        float d = distance(p.xz, uMouse);
        h += sin(d * 3.2 - uTime * 5.0) * exp(-d * 0.55) * 0.45 * uMouseStrength;
        p.y = h;
        vH = h;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uPx * (2.2 + h * 1.2) * (7.0 / -mv.z);
        vFade = smoothstep(18.0, 6.0, -mv.z) * smoothstep(11.5, 6.0, abs(p.x));
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColorA; uniform vec3 uColorB; uniform float uAlpha;
      varying float vH; varying float vFade;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        vec3 col = mix(uColorB, uColorA, smoothstep(-0.5, 0.7, vH));
        gl_FragColor = vec4(col, uAlpha * vFade * smoothstep(0.5, 0.1, d));
      }`,
  });
  scene.add(new THREE.Points(geometry, material));

  raycaster = new THREE.Raycaster();
  plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  hit = new THREE.Vector3();

  const onMove = (e) => {
    if (e.pointerType === "touch") return;
    const r = container.getBoundingClientRect();
    if (e.clientY < r.top || e.clientY > r.bottom) {
      mouse.ndc = null;
      return;
    }
    mouse.ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  stage.compile();

  return {
    setColors(a, b, isLight) {
      material.uniforms.uColorA.value.set(a);
      material.uniforms.uColorB.value.set(b);
      material.blending = isLight ? THREE.NormalBlending : THREE.AdditiveBlending;
      material.uniforms.uAlpha.value = isLight ? 0.9 : 0.75;
      material.needsUpdate = true;
      if (stage.reduced) stage.renderOnce();
    },
    destroy() {
      window.removeEventListener("pointermove", onMove);
      stage.destroy();
    },
  };
}
