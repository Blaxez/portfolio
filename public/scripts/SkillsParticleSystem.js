import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

export class SkillsParticleSystem {
  constructor(containerId, data) {
    this.container = document.getElementById(containerId);
    if (!this.container) throw new Error(`Container #${containerId} not found`);

    this.data = data;
    this.config = {
      maxParticles: 40000,
      particleSize: 2.0,
      morphSpeed: 1.5,
      explosionForce: 0.5,
      primaryColor: "#00f3ff",
      secondaryColor: "#ff0055",
      bgColor: "#030305",
      bloomStrength: 3.2,
      bloomRadius: 0.8,
      bloomThreshold: 0.0,
    };

    // State
    this.currentSkill = -1;
    this.isMorphing = false;
    this.morphTime = 0;
    this.clock = new THREE.Clock();

    // Three.js components
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.composer = null;
    this.controls = null;
    this.particleSystem = null;
    this.geometry = null;
    this.material = null;

    // Canvas for icon generation
    this.canvasCtx = null;
    this.setupFontCanvas();

    this.init();
  }

  setupFontCanvas() {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    this.canvasCtx = canvas.getContext("2d", { willReadFrequently: true });
  }

  init() {
    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(this.config.bgColor, 0.02); // Reduced fog for better visibility at distance
    this.scene.background = new THREE.Color(this.config.bgColor);

    // 2. Camera
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000); // Increased far plane
    this.camera.position.set(0, 0, 20); // Moved back slightly

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      preserveDrawingBuffer: true,
    }); // Antialias false for post-processing performance
    this.renderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight
    );
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ReinhardToneMapping;
    this.container.appendChild(this.renderer.domElement);

    // 4. Post-processing (Bloom)
    const renderScene = new RenderPass(this.scene, this.camera);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(
        this.container.clientWidth,
        this.container.clientHeight
      ),
      this.config.bloomStrength,
      this.config.bloomRadius,
      this.config.bloomThreshold
    );

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(renderScene);
    this.composer.addPass(bloomPass);

    // 5. Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 1.0;
    this.controls.enableZoom = true;
    this.controls.enablePan = false;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 50;

    // 6. Particles
    this.createParticleSystem();

    // 7. Events
    window.addEventListener("resize", this.onResize.bind(this));

    // Initial Resize to set correct camera pos
    this.onResize();

    // Start Loop
    this.renderer.setAnimationLoop(this.animate.bind(this));
  }

  createParticleSystem() {
    this.geometry = new THREE.BufferGeometry();

    const posCurrent = new Float32Array(this.config.maxParticles * 3);
    const posTarget = new Float32Array(this.config.maxParticles * 3);
    const randoms = new Float32Array(this.config.maxParticles);
    const actives = new Float32Array(this.config.maxParticles);

    for (let i = 0; i < this.config.maxParticles; i++) {
      randoms[i] = Math.random();
      actives[i] = 0;
    }

    this.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(posCurrent, 3)
    );
    this.geometry.setAttribute(
      "aTarget",
      new THREE.BufferAttribute(posTarget, 3)
    );
    this.geometry.setAttribute(
      "aRandom",
      new THREE.BufferAttribute(randoms, 1)
    );
    this.geometry.setAttribute(
      "aActive",
      new THREE.BufferAttribute(actives, 1)
    );

    this.material = new THREE.ShaderMaterial({
      vertexShader: `
                uniform float uTime;
                uniform float uMix;
                uniform float uSize;
                uniform float uExplosion;
                
                attribute vec3 aTarget;
                attribute float aRandom;
                attribute float aActive;
                
                varying float vAlpha;
                varying float vDepth;

                vec3 noise(vec3 p) {
                    return vec3(
                        sin(p.y * 3.0 + uTime),
                        cos(p.z * 3.0 + uTime),
                        sin(p.x * 3.0 + uTime)
                    ) * 0.1;
                }

                void main() {
                    vec3 posA = position;
                    vec3 posB = aTarget;
                    
                    float scatter = sin(uMix * 3.14159) * uExplosion;
                    vec3 dir = normalize(posA + vec3(0.001));
                    vec3 noiseVec = noise(posA * 2.0) * scatter * 5.0;
                    
                    vec3 mixedPos = mix(posA, posB, uMix);
                    mixedPos += (dir * scatter * 3.0) + noiseVec;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(mixedPos, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                    
                    gl_PointSize = uSize * (20.0 / -mvPosition.z);
                    vDepth = -mvPosition.z;
                    
                    float blink = sin(uTime * 5.0 + aRandom * 10.0) * 0.5 + 0.5;
                    vAlpha = aActive * (0.3 + 0.7 * blink);
                }
            `,
      fragmentShader: `
                uniform vec3 uColor;
                uniform vec3 uColor2;
                uniform float uGlow; // Used for brightness inside shader
                
                varying float vAlpha;
                varying float vDepth;

                void main() {
                    vec2 uv = gl_PointCoord.xy - 0.5;
                    float r = length(uv);
                    if (r > 0.5) discard;
                    
                    // Soft Glow Gradient
                    float glow = 1.0 - (r * 2.0);
                    glow = pow(glow, 2.0);
                    
                    float fog = clamp((40.0 - vDepth) / 30.0, 0.0, 1.0);
                    vec3 finalColor = mix(uColor, uColor2, r);
                    
                    // Boost color for bloom
                    finalColor *= 4.0; 

                    gl_FragColor = vec4(finalColor, vAlpha * glow * fog);
                }
            `,
      uniforms: {
        uTime: { value: 0 },
        uMix: { value: 0 },
        uSize: { value: this.config.particleSize },
        uExplosion: { value: this.config.explosionForce },
        uColor: { value: new THREE.Color(this.config.primaryColor) },
        uColor2: { value: new THREE.Color(this.config.secondaryColor) },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.particleSystem = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.particleSystem);
  }

  loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  async getPointsFromImage(source) {
    const width = 512;
    const height = 512;
    this.canvasCtx.clearRect(0, 0, width, height);

    const url = source.startsWith("http")
      ? source
      : `https://cdn.simpleicons.org/${source}/white`;

    try {
      const img = await this.loadImage(url);

      const aspect = img.width / img.height;
      let drawW = width;
      let drawH = height;
      if (aspect > 1) drawH = width / aspect;
      else drawW = height * aspect;

      const x = (width - drawW) / 2;
      const y = (height - drawH) / 2;

      this.canvasCtx.drawImage(img, x, y, drawW, drawH);

      const imgData = this.canvasCtx.getImageData(0, 0, width, height);
      const data = imgData.data;
      const points = [];
      const gap = 3;

      for (let iy = 0; iy < height; iy += gap) {
        for (let ix = 0; ix < width; ix += gap) {
          const index = (iy * width + ix) * 4;
          const alpha = data[index + 3];

          if (alpha > 20) {
            const pX = (ix / width - 0.5) * 10;
            const pY = ((height - iy) / height - 0.5) * 10;
            const pZ = (Math.random() - 0.5) * 1.5;
            points.push(pX, pY, pZ);
          }
        }
      }
      return points;
    } catch (e) {
      console.error("Failed to load icon:", source, e);
      return [];
    }
  }

  async loadSkill(index) {
    if (this.isMorphing || index === this.currentSkill) return;

    const skill = this.data[index];

    // Trigger callback if needed
    if (this.onSkillChange) this.onSkillChange(skill, index);

    const points = await this.getPointsFromImage(skill.iconUrl || skill.slug);

    // Shuffle
    for (let i = points.length / 3 - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [points[i * 3], points[j * 3]] = [points[j * 3], points[i * 3]];
      [points[i * 3 + 1], points[j * 3 + 1]] = [
        points[j * 3 + 1],
        points[i * 3 + 1],
      ];
      [points[i * 3 + 2], points[j * 3 + 2]] = [
        points[j * 3 + 2],
        points[i * 3 + 2],
      ];
    }

    const targetAttr = this.geometry.attributes.aTarget;
    const activeAttr = this.geometry.attributes.aActive;

    for (let i = 0; i < this.config.maxParticles; i++) {
      if (i < points.length / 3) {
        targetAttr.setXYZ(
          i,
          points[i * 3],
          points[i * 3 + 1],
          points[i * 3 + 2]
        );
        activeAttr.setX(i, 1.0);
      } else {
        targetAttr.setXYZ(
          i,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20
        );
        activeAttr.setX(i, 0.0);
      }
    }
    targetAttr.needsUpdate = true;
    activeAttr.needsUpdate = true;

    this.isMorphing = true;
    this.morphTime = 0;
    this.currentSkill = index;

    this.material.uniforms.uColor.value.set(skill.color);
  }

  animate() {
    const dt = this.clock.getDelta();

    if (this.isMorphing) {
      this.morphTime += dt * this.config.morphSpeed;

      if (this.morphTime >= 1.0) {
        this.morphTime = 1.0;
        this.isMorphing = false;

        const posAttr = this.geometry.attributes.position;
        const targetAttr = this.geometry.attributes.aTarget;

        posAttr.array.set(targetAttr.array);
        posAttr.needsUpdate = true;
        this.material.uniforms.uMix.value = 0.0;
      } else {
        const t =
          this.morphTime * this.morphTime * (3.0 - 2.0 * this.morphTime);
        this.material.uniforms.uMix.value = t;
      }
    }

    this.material.uniforms.uTime.value = this.clock.getElapsedTime();
    this.controls.update();
    this.composer.render();
  }

  onResize() {
    if (!this.container || !this.camera || !this.renderer) return;

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);

    // Responsive Camera Distance
    const isMobile = width < 768;

    // Calculate distance needed to keep the object visible
    // On mobile, we use a smaller "target width" (14) to allow closer zoom
    const targetDistance = (isMobile ? 14 : 18) / this.camera.aspect;

    if (isMobile) {
      // Closer camera for mobile to avoid "far away" look
      this.camera.position.z = Math.min(targetDistance, 35);
      // Significantly larger particles on mobile for better visibility
      this.material.uniforms.uSize.value = this.config.particleSize * 2.5;
    } else {
      // Standard clamping for desktop
      this.camera.position.z = Math.max(20, Math.min(targetDistance, 60));
      this.material.uniforms.uSize.value = this.config.particleSize;
    }
  }
}
