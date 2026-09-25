import { createStage, SNOISE } from "./stage";

/**
 * Holographic orb: noise-displaced icosphere with an iridescent fresnel
 * shader, a counter-rotating wireframe shell and an orbiting particle ring.
 * Pointer tilts it; scroll progress (0..1) charges the displacement.
 */
export function mountHoloOrb(container, { colorA = "#60a5fa", colorB = "#818cf8" } = {}) {
  let progress = 0;
  let uniforms;
  let group;
  let shell;
  let ring;

  const stage = createStage(container, {
    fov: 32,
    z: 6.4,
    onFrame: ({ t, dt, pointer }) => {
      uniforms.uTime.value = t;
      uniforms.uAmp.value += (0.16 + progress * 0.3 - uniforms.uAmp.value) * Math.min(1, dt * 3);
      group.rotation.y += dt * 0.18;
      group.rotation.x += (pointer.y * 0.35 - group.rotation.x) * Math.min(1, dt * 3);
      group.rotation.z += (-pointer.x * 0.25 - group.rotation.z) * Math.min(1, dt * 3);
      shell.rotation.y -= dt * 0.3;
      shell.rotation.x += dt * 0.08;
      ring.rotation.z += dt * 0.12;
      ring.material.uniforms.uTime.value = t;
    },
    onResize: ({ camera, w, h }) => {
      // Keep the orb framed in portrait containers.
      camera.position.z = w < h ? 6.4 * (h / w) * 0.85 : 6.4;
    },
  });
  const { THREE, scene, isMobile } = stage;

  uniforms = {
    uTime: { value: 0 },
    uAmp: { value: 0.16 },
    uFreq: { value: 1.35 },
    uColorA: { value: new THREE.Color(colorA) },
    uColorB: { value: new THREE.Color(colorB) },
  };

  group = new THREE.Group();
  scene.add(group);

  const orb = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.25, isMobile ? 14 : 32),
    new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      vertexShader: /* glsl */ `
        uniform float uTime; uniform float uAmp; uniform float uFreq;
        varying vec3 vViewPos; varying float vNoise;
        ${SNOISE}
        void main() {
          vec3 n = normalize(position);
          float noise = snoise(n * uFreq + vec3(0.0, uTime * 0.22, 0.0));
          noise += 0.45 * snoise(n * uFreq * 2.4 - vec3(uTime * 0.18));
          vNoise = noise;
          vec3 displaced = position + n * noise * uAmp;
          vec4 mv = modelViewMatrix * vec4(displaced, 1.0);
          vViewPos = mv.xyz;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform float uTime; uniform vec3 uColorA; uniform vec3 uColorB;
        varying vec3 vViewPos; varying float vNoise;
        void main() {
          vec3 N = normalize(cross(dFdx(vViewPos), dFdy(vViewPos)));
          vec3 V = normalize(-vViewPos);
          float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.0);
          vec3 irid = 0.5 + 0.5 * cos(6.28318 * (fres * 0.85 + vNoise * 0.22 + vec3(0.0, 0.33, 0.67)) + uTime * 0.25);
          vec3 base = mix(uColorA, uColorB, smoothstep(-0.7, 0.7, vNoise));
          vec3 L = normalize(vec3(0.5, 0.8, 0.6));
          float diff = max(dot(N, L), 0.0);
          float spec = pow(max(dot(reflect(-L, N), V), 0.0), 48.0);
          vec3 col = base * (0.18 + 0.5 * diff) + irid * fres * 0.95 + uColorA * pow(fres, 5.0) * 1.4 + spec * 0.7;
          gl_FragColor = vec4(col, 0.96);
        }`,
    }),
  );
  group.add(orb);

  shell = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1.75, isMobile ? 1 : 2)),
    new THREE.LineBasicMaterial({ color: colorA, transparent: true, opacity: 0.18, depthWrite: false }),
  );
  group.add(shell);

  const count = isMobile ? 700 : 1800;
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 2.05 + (Math.random() - 0.5) * 0.45 + Math.pow(Math.random(), 3) * 0.6;
    positions[i * 3] = Math.cos(a) * r;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 0.12;
    positions[i * 3 + 2] = Math.sin(a) * r;
    seeds[i] = Math.random();
  }
  const ringGeo = new THREE.BufferGeometry();
  ringGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  ringGeo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  ring = new THREE.Points(
    ringGeo,
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(colorA) }, uPx: { value: stage.renderer.getPixelRatio() } },
      vertexShader: /* glsl */ `
        uniform float uTime; uniform float uPx; attribute float aSeed; varying float vAlpha;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (1.5 + aSeed * 2.5) * uPx * (6.0 / -mv.z);
          vAlpha = 0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * 2.0 + aSeed * 40.0));
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor; varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          gl_FragColor = vec4(uColor, vAlpha * smoothstep(0.5, 0.0, d));
        }`,
    }),
  );
  ring.rotation.x = 1.15;
  ring.rotation.y = 0.3;
  group.add(ring);

  stage.compile();

  return {
    setProgress(p) {
      progress = p;
      if (stage.reduced) stage.renderOnce();
    },
    destroy: stage.destroy,
  };
}
