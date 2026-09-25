(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,49327,e=>{"use strict";var t=e.i(90072),i=e.i(8560);let r={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`};var s=t;class o{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}}let a=new s.OrthographicCamera(-1,1,1,-1,0,1);class n extends s.BufferGeometry{constructor(){super(),this.setAttribute("position",new s.Float32BufferAttribute([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new s.Float32BufferAttribute([0,2,0,0,2,0],2))}}let l=new n;class h{constructor(e){this._mesh=new s.Mesh(l,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,a)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}}class u extends o{constructor(e,i="tDiffuse"){super(),this.textureID=i,this.uniforms=null,this.material=null,e instanceof t.ShaderMaterial?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=t.UniformsUtils.clone(e.uniforms),this.material=new t.ShaderMaterial({name:void 0!==e.name?e.name:"unspecified",defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this._fsQuad=new h(this.material)}render(e,t,i){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=i.texture),this._fsQuad.material=this.material,this.renderToScreen?e.setRenderTarget(null):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil)),this._fsQuad.render(e)}dispose(){this.material.dispose(),this._fsQuad.dispose()}}class d extends o{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,i){let r,s,o=e.getContext(),a=e.state;a.buffers.color.setMask(!1),a.buffers.depth.setMask(!1),a.buffers.color.setLocked(!0),a.buffers.depth.setLocked(!0),this.inverse?(r=0,s=1):(r=1,s=0),a.buffers.stencil.setTest(!0),a.buffers.stencil.setOp(o.REPLACE,o.REPLACE,o.REPLACE),a.buffers.stencil.setFunc(o.ALWAYS,r,0xffffffff),a.buffers.stencil.setClear(s),a.buffers.stencil.setLocked(!0),e.setRenderTarget(i),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),a.buffers.color.setLocked(!1),a.buffers.depth.setLocked(!1),a.buffers.color.setMask(!0),a.buffers.depth.setMask(!0),a.buffers.stencil.setLocked(!1),a.buffers.stencil.setFunc(o.EQUAL,1,0xffffffff),a.buffers.stencil.setOp(o.KEEP,o.KEEP,o.KEEP),a.buffers.stencil.setLocked(!0)}}class c extends o{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}}class m{constructor(e,i){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),void 0===i){const r=e.getSize(new t.Vector2);this._width=r.width,this._height=r.height,(i=new t.WebGLRenderTarget(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:t.HalfFloatType})).texture.name="EffectComposer.rt1"}else this._width=i.width,this._height=i.height;this.renderTarget1=i,this.renderTarget2=i.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new u(r),this.copyPass.material.blending=t.NoBlending,this.clock=new t.Clock}swapBuffers(){let e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){let t=this.passes.indexOf(e);-1!==t&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){void 0===e&&(e=this.clock.getDelta());let t=this.renderer.getRenderTarget(),i=!1;for(let t=0,r=this.passes.length;t<r;t++){let r=this.passes[t];if(!1!==r.enabled){if(r.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(t),r.render(this.renderer,this.writeBuffer,this.readBuffer,e,i),r.needsSwap){if(i){let t=this.renderer.getContext(),i=this.renderer.state.buffers.stencil;i.setFunc(t.NOTEQUAL,1,0xffffffff),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),i.setFunc(t.EQUAL,1,0xffffffff)}this.swapBuffers()}void 0!==d&&(r instanceof d?i=!0:r instanceof c&&(i=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(void 0===e){let i=this.renderer.getSize(new t.Vector2);this._pixelRatio=this.renderer.getPixelRatio(),this._width=i.width,this._height=i.height,(e=this.renderTarget1.clone()).setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;let i=this._width*this._pixelRatio,r=this._height*this._pixelRatio;this.renderTarget1.setSize(i,r),this.renderTarget2.setSize(i,r);for(let e=0;e<this.passes.length;e++)this.passes[e].setSize(i,r)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}}class f extends o{constructor(e,i,r=null,s=null,o=null){super(),this.scene=e,this.camera=i,this.overrideMaterial=r,this.clearColor=s,this.clearAlpha=o,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this.isRenderPass=!0,this._oldClearColor=new t.Color}render(e,t,i){let r,s,o=e.autoClear;e.autoClear=!1,null!==this.overrideMaterial&&(s=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),null!==this.clearColor&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),null!==this.clearAlpha&&(r=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),!0==this.clearDepth&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:i),!0===this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),null!==this.clearColor&&e.setClearColor(this._oldClearColor),null!==this.clearAlpha&&e.setClearAlpha(r),null!==this.overrideMaterial&&(this.scene.overrideMaterial=s),e.autoClear=o}}let p={name:"LuminosityHighPassShader",uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new t.Color(0)},defaultOpacity:{value:0}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform sampler2D tDiffuse;
		uniform vec3 defaultColor;
		uniform float defaultOpacity;
		uniform float luminosityThreshold;
		uniform float smoothWidth;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );

			float v = luminance( texel.xyz );

			vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );

			float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );

			gl_FragColor = mix( outputColor, texel, alpha );

		}`};class v extends o{constructor(e,i=1,s,o){super(),this.strength=i,this.radius=s,this.threshold=o,this.resolution=void 0!==e?new t.Vector2(e.x,e.y):new t.Vector2(256,256),this.clearColor=new t.Color(0,0,0),this.needsSwap=!1,this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let a=Math.round(this.resolution.x/2),n=Math.round(this.resolution.y/2);this.renderTargetBright=new t.WebGLRenderTarget(a,n,{type:t.HalfFloatType}),this.renderTargetBright.texture.name="UnrealBloomPass.bright",this.renderTargetBright.texture.generateMipmaps=!1;for(let e=0;e<this.nMips;e++){const i=new t.WebGLRenderTarget(a,n,{type:t.HalfFloatType});i.texture.name="UnrealBloomPass.h"+e,i.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(i);const r=new t.WebGLRenderTarget(a,n,{type:t.HalfFloatType});r.texture.name="UnrealBloomPass.v"+e,r.texture.generateMipmaps=!1,this.renderTargetsVertical.push(r),a=Math.round(a/2),n=Math.round(n/2)}this.highPassUniforms=t.UniformsUtils.clone(p.uniforms),this.highPassUniforms.luminosityThreshold.value=o,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new t.ShaderMaterial({uniforms:this.highPassUniforms,vertexShader:p.vertexShader,fragmentShader:p.fragmentShader}),this.separableBlurMaterials=[];const l=[6,10,14,18,22];a=Math.round(this.resolution.x/2),n=Math.round(this.resolution.y/2);for(let e=0;e<this.nMips;e++)this.separableBlurMaterials.push(this._getSeparableBlurMaterial(l[e])),this.separableBlurMaterials[e].uniforms.invSize.value=new t.Vector2(1/a,1/n),a=Math.round(a/2),n=Math.round(n/2);this.compositeMaterial=this._getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=i,this.compositeMaterial.uniforms.bloomRadius.value=.1,this.compositeMaterial.uniforms.bloomFactors.value=[1,.8,.6,.4,.2],this.bloomTintColors=[new t.Vector3(1,1,1),new t.Vector3(1,1,1),new t.Vector3(1,1,1),new t.Vector3(1,1,1),new t.Vector3(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,this.copyUniforms=t.UniformsUtils.clone(r.uniforms),this.blendMaterial=new t.ShaderMaterial({uniforms:this.copyUniforms,vertexShader:r.vertexShader,fragmentShader:r.fragmentShader,premultipliedAlpha:!0,blending:t.AdditiveBlending,depthTest:!1,depthWrite:!1,transparent:!0}),this._oldClearColor=new t.Color,this._oldClearAlpha=1,this._basic=new t.MeshBasicMaterial,this._fsQuad=new h(null)}dispose(){for(let e=0;e<this.renderTargetsHorizontal.length;e++)this.renderTargetsHorizontal[e].dispose();for(let e=0;e<this.renderTargetsVertical.length;e++)this.renderTargetsVertical[e].dispose();this.renderTargetBright.dispose();for(let e=0;e<this.separableBlurMaterials.length;e++)this.separableBlurMaterials[e].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this._basic.dispose(),this._fsQuad.dispose()}setSize(e,i){let r=Math.round(e/2),s=Math.round(i/2);this.renderTargetBright.setSize(r,s);for(let e=0;e<this.nMips;e++)this.renderTargetsHorizontal[e].setSize(r,s),this.renderTargetsVertical[e].setSize(r,s),this.separableBlurMaterials[e].uniforms.invSize.value=new t.Vector2(1/r,1/s),r=Math.round(r/2),s=Math.round(s/2)}render(e,t,i,r,s){e.getClearColor(this._oldClearColor),this._oldClearAlpha=e.getClearAlpha();let o=e.autoClear;e.autoClear=!1,e.setClearColor(this.clearColor,0),s&&e.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this._fsQuad.material=this._basic,this._basic.map=i.texture,e.setRenderTarget(null),e.clear(),this._fsQuad.render(e)),this.highPassUniforms.tDiffuse.value=i.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this._fsQuad.material=this.materialHighPassFilter,e.setRenderTarget(this.renderTargetBright),e.clear(),this._fsQuad.render(e);let a=this.renderTargetBright;for(let t=0;t<this.nMips;t++)this._fsQuad.material=this.separableBlurMaterials[t],this.separableBlurMaterials[t].uniforms.colorTexture.value=a.texture,this.separableBlurMaterials[t].uniforms.direction.value=v.BlurDirectionX,e.setRenderTarget(this.renderTargetsHorizontal[t]),e.clear(),this._fsQuad.render(e),this.separableBlurMaterials[t].uniforms.colorTexture.value=this.renderTargetsHorizontal[t].texture,this.separableBlurMaterials[t].uniforms.direction.value=v.BlurDirectionY,e.setRenderTarget(this.renderTargetsVertical[t]),e.clear(),this._fsQuad.render(e),a=this.renderTargetsVertical[t];this._fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,e.setRenderTarget(this.renderTargetsHorizontal[0]),e.clear(),this._fsQuad.render(e),this._fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,s&&e.state.buffers.stencil.setTest(!0),this.renderToScreen?e.setRenderTarget(null):e.setRenderTarget(i),this._fsQuad.render(e),e.setClearColor(this._oldClearColor,this._oldClearAlpha),e.autoClear=o}_getSeparableBlurMaterial(e){let i=[],r=e/3;for(let t=0;t<e;t++)i.push(.39894*Math.exp(-.5*t*t/(r*r))/r);return new t.ShaderMaterial({defines:{KERNEL_RADIUS:e},uniforms:{colorTexture:{value:null},invSize:{value:new t.Vector2(.5,.5)},direction:{value:new t.Vector2(.5,.5)},gaussianCoefficients:{value:i}},vertexShader:`

				varying vec2 vUv;

				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}`,fragmentShader:`

				#include <common>

				varying vec2 vUv;

				uniform sampler2D colorTexture;
				uniform vec2 invSize;
				uniform vec2 direction;
				uniform float gaussianCoefficients[KERNEL_RADIUS];

				void main() {

					float weightSum = gaussianCoefficients[0];
					vec3 diffuseSum = texture2D( colorTexture, vUv ).rgb * weightSum;

					for ( int i = 1; i < KERNEL_RADIUS; i ++ ) {

						float x = float( i );
						float w = gaussianCoefficients[i];
						vec2 uvOffset = direction * invSize * x;
						vec3 sample1 = texture2D( colorTexture, vUv + uvOffset ).rgb;
						vec3 sample2 = texture2D( colorTexture, vUv - uvOffset ).rgb;
						diffuseSum += ( sample1 + sample2 ) * w;

					}

					gl_FragColor = vec4( diffuseSum, 1.0 );

				}`})}_getCompositeMaterial(e){return new t.ShaderMaterial({defines:{NUM_MIPS:e},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`

				varying vec2 vUv;

				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}`,fragmentShader:`

				varying vec2 vUv;

				uniform sampler2D blurTexture1;
				uniform sampler2D blurTexture2;
				uniform sampler2D blurTexture3;
				uniform sampler2D blurTexture4;
				uniform sampler2D blurTexture5;
				uniform float bloomStrength;
				uniform float bloomRadius;
				uniform float bloomFactors[NUM_MIPS];
				uniform vec3 bloomTintColors[NUM_MIPS];

				float lerpBloomFactor( const in float factor ) {

					float mirrorFactor = 1.2 - factor;
					return mix( factor, mirrorFactor, bloomRadius );

				}

				void main() {

					// 3.0 for backwards compatibility with previous alpha-based intensity
					vec3 bloom = 3.0 * bloomStrength * (
						lerpBloomFactor( bloomFactors[ 0 ] ) * bloomTintColors[ 0 ] * texture2D( blurTexture1, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 1 ] ) * bloomTintColors[ 1 ] * texture2D( blurTexture2, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 2 ] ) * bloomTintColors[ 2 ] * texture2D( blurTexture3, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 3 ] ) * bloomTintColors[ 3 ] * texture2D( blurTexture4, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 4 ] ) * bloomTintColors[ 4 ] * texture2D( blurTexture5, vUv ).rgb
					);

					float bloomAlpha = max( bloom.r, max( bloom.g, bloom.b ) );
					gl_FragColor = vec4( bloom, bloomAlpha );

				}`})}}v.BlurDirectionX=new t.Vector2(1,0),v.BlurDirectionY=new t.Vector2(0,1);var g=e.i(25199);class b{constructor(e,i){if(this.container=e,!this.container)throw Error("Container not found");this.data=i;const r=window.matchMedia("(max-width: 767px)").matches;this.reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches,this.isMobile=r,this.config={maxParticles:r?14e3:3e4,particleSize:r?4:2,morphSpeed:1.5,explosionForce:.5,bgColor:"#050505",bloom:!r,bloomStrength:.85,bloomRadius:.4,bloomThreshold:0},this.currentSkill=-1,this.pendingSkill=null,this.isMorphing=!1,this.morphTime=0,this.loadToken=0,this.pointsCache=new Map,this.inView=!1,this.running=!1,this.elapsed=0,this.last=performance.now(),this.pointerNdc=new t.Vector2(10,10),this.pointerActive=0,this.tilt={x:0,y:0},this.onSkillChange=null;const s=document.createElement("canvas");s.width=512,s.height=512,this.canvasCtx=s.getContext("2d",{willReadFrequently:!0}),this.animate=this.animate.bind(this),this.onResize=this.onResize.bind(this),this.onPointerMove=this.onPointerMove.bind(this),this.onPointerLeave=this.onPointerLeave.bind(this),this.onVisibility=this.onVisibility.bind(this),this.init()}init(){this.scene=new t.Scene,this.scene.fog=new t.FogExp2(this.config.bgColor,.015),this.scene.background=new t.Color(this.config.bgColor);let{clientWidth:e,clientHeight:r}=this.container;this.camera=new t.PerspectiveCamera(45,e/r,.1,1e3),this.camera.position.set(0,0,20),this.renderer=new i.WebGLRenderer({antialias:!1,alpha:!1,powerPreference:"high-performance"}),this.pixelRatio=Math.min(window.devicePixelRatio||1,this.isMobile?1.5:1.75),this.renderer.setPixelRatio(this.pixelRatio),this.renderer.setSize(e,r),this.renderer.toneMapping=t.ReinhardToneMapping;let s=this.renderer.domElement;s.style.display="block",s.style.pointerEvents="none",s.setAttribute("aria-hidden","true"),this.container.appendChild(s),this.config.bloom&&(this.composer=new m(this.renderer),this.composer.addPass(new f(this.scene,this.camera)),this.composer.addPass(new v(new t.Vector2(e,r),this.config.bloomStrength,this.config.bloomRadius,this.config.bloomThreshold))),this.createParticleSystem(),this.raycaster=new t.Raycaster,this.plane=new t.Plane(new t.Vector3(0,0,1),0),this.hit=new t.Vector3,this.inverse=new t.Matrix4,window.addEventListener("resize",this.onResize),window.addEventListener("pointermove",this.onPointerMove,{passive:!0}),document.addEventListener("pointerleave",this.onPointerLeave),document.addEventListener("visibilitychange",this.onVisibility),this.io=new IntersectionObserver(([e])=>{this.inView=e.isIntersecting,this.updateLoop()},{rootMargin:"50px 0px"}),this.io.observe(this.container),this.onResize(),this.compiled=!1;let o=()=>{this.compiled=!0,this.updateLoop(),this.renderStill()};"function"==typeof this.renderer.compileAsync&&this.renderer.extensions.has("KHR_parallel_shader_compile")?this.renderer.compileAsync(this.scene,this.camera).then(o,o):o()}createParticleSystem(){let e=this.config.maxParticles;this.geometry=new t.BufferGeometry;let i=new Float32Array(3*e),r=new Float32Array(3*e),s=new Float32Array(e),o=new Float32Array(e);for(let t=0;t<e;t++)s[t]=Math.random(),i[3*t]=(Math.random()-.5)*20,i[3*t+1]=(Math.random()-.5)*20,i[3*t+2]=(Math.random()-.5)*20;this.geometry.setAttribute("position",new t.BufferAttribute(i,3)),this.geometry.setAttribute("aTarget",new t.BufferAttribute(r,3)),this.geometry.setAttribute("aRandom",new t.BufferAttribute(s,1)),this.geometry.setAttribute("aActive",new t.BufferAttribute(o,1)),this.material=new t.ShaderMaterial({vertexShader:`
        uniform float uTime;
        uniform float uMix;
        uniform float uSize;
        uniform float uExplosion;
        uniform float uScatter;
        uniform vec3 uMouse;
        uniform float uMouseStrength;
        uniform float uPixelRatio;

        attribute vec3 aTarget;
        attribute float aRandom;
        attribute float aActive;

        varying float vAlpha;
        varying float vDepth;
        varying float vHeat;

        vec3 swirl(vec3 p) {
          return vec3(sin(p.y * 3.0 + uTime), cos(p.z * 3.0 + uTime), sin(p.x * 3.0 + uTime)) * 0.1;
        }

        void main() {
          vec3 posA = position;
          vec3 posB = aTarget;

          float scatter = sin(uMix * 3.14159) * uExplosion;
          vec3 dir = normalize(posA + vec3(0.001));
          vec3 p = mix(posA, posB, uMix);
          p += dir * scatter * 3.0 + swirl(posA * 2.0) * scatter * 5.0;

          // Scroll-driven dispersal.
          vec3 rnd = vec3(fract(aRandom * 13.17) - 0.5, fract(aRandom * 71.71) - 0.5, fract(aRandom * 37.37) - 0.5);
          p += (normalize(p + 0.001) * 5.0 + rnd * 16.0) * uScatter * (0.35 + aRandom);

          // Pointer repulsion in the logo plane.
          vec2 away = p.xy - uMouse.xy;
          float d = length(away);
          float force = smoothstep(2.6, 0.0, d) * uMouseStrength;
          p.xy += normalize(away + 0.0001) * force * 1.8;
          p.z += force * 1.4;
          vHeat = force;

          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = uSize * uPixelRatio * (20.0 / -mv.z) * (1.0 + force * 0.8);
          vDepth = -mv.z;

          float blink = sin(uTime * 5.0 + aRandom * 10.0) * 0.5 + 0.5;
          vAlpha = aActive * (0.3 + 0.7 * blink) * (1.0 - uScatter * 0.35);
        }
      `,fragmentShader:`
        uniform vec3 uColor;
        uniform float uBoost;
        varying float vAlpha;
        varying float vDepth;
        varying float vHeat;

        void main() {
          vec2 uv = gl_PointCoord.xy - 0.5;
          float r = length(uv);
          if (r > 0.5) discard;
          float glow = pow(1.0 - r * 2.0, 2.0);
          float fog = clamp((40.0 - vDepth) / 30.0, 0.0, 1.0);
          vec3 col = mix(uColor, vec3(1.0), vHeat * 0.6) * uBoost;
          gl_FragColor = vec4(col, min(1.0, vAlpha * glow * fog * (uBoost * 0.5)));
        }
      `,uniforms:{uTime:{value:0},uMix:{value:0},uSize:{value:this.config.particleSize},uExplosion:{value:this.config.explosionForce},uScatter:{value:1},uMouse:{value:new t.Vector3(999,999,0)},uMouseStrength:{value:0},uPixelRatio:{value:this.pixelRatio},uColor:{value:new t.Color("#60a5fa")},uBoost:{value:this.config.bloom?2:3.2}},transparent:!0,depthWrite:!1,blending:t.AdditiveBlending}),this.particleSystem=new t.Points(this.geometry,this.material),this.scene.add(this.particleSystem)}loadImage(e){return new Promise((t,i)=>{let r=new Image;r.crossOrigin="anonymous",r.onload=()=>t(r),r.onerror=i,r.src=e})}async getPointsFromImage(e){if(this.pointsCache.has(e))return this.pointsCache.get(e);let t=this.canvasCtx;t.clearRect(0,0,512,512);try{let i=await this.loadImage(e),r=i.width/i.height||1,s=r>1?512:512*r,o=r>1?512/r:512;t.drawImage(i,(512-s)/2,(512-o)/2,s,o);let a=t.getImageData(0,0,512,512).data,n=this.isMobile?4:3,l=[];for(let e=0;e<512;e+=n)for(let t=0;t<512;t+=n)a[(512*e+t)*4+3]>20&&l.push((t/512-.5)*10,((512-e)/512-.5)*10,(Math.random()-.5)*1.5);return this.pointsCache.set(e,l),l}catch(t){return console.error("Failed to load skill icon:",e,t),[]}}async loadSkill(e){if(e===this.currentSkill&&null===this.pendingSkill)return;if(this.isMorphing){this.pendingSkill=e;return}let t=++this.loadToken,i=this.data[e];this.onSkillChange?.(i,e);let r=(0,g.getAssetPath)(`/assets/skills/${i.icon}`),s=(await this.getPointsFromImage(r)).slice();if(t!==this.loadToken||!this.geometry)return;let o=s.length/3;for(let e=o-1;e>0;e--){let t=Math.floor(Math.random()*(e+1));for(let i=0;i<3;i++)[s[3*e+i],s[3*t+i]]=[s[3*t+i],s[3*e+i]]}let a=this.geometry.attributes.aTarget,n=this.geometry.attributes.aActive;for(let e=0;e<this.config.maxParticles;e++)e<o?(a.setXYZ(e,s[3*e],s[3*e+1],s[3*e+2]),n.setX(e,1)):(a.setXYZ(e,(Math.random()-.5)*20,(Math.random()-.5)*20,(Math.random()-.5)*20),n.setX(e,0));a.needsUpdate=!0,n.needsUpdate=!0,this.material.uniforms.uColor.value.set(i.color),this.currentSkill=e,this.isMorphing=!0,this.morphTime=+!!this.reduced,this.renderStill()}setScatter(e){this.material&&(this.material.uniforms.uScatter.value=e,this.renderStill())}onPointerMove(e){let t=this.container.getBoundingClientRect();if(e.clientY<t.top||e.clientY>t.bottom||"touch"===e.pointerType){this.pointerActive=0;return}this.pointerNdc.set((e.clientX-t.left)/t.width*2-1,-(2*((e.clientY-t.top)/t.height))+1),this.pointerActive=1}onPointerLeave(){this.pointerActive=0}onVisibility(){this.updateLoop()}updateLoop(){let e=this.compiled&&this.inView&&!document.hidden&&!this.reduced;e&&!this.running?(this.running=!0,this.last=performance.now(),this.renderer.setAnimationLoop(this.animate)):!e&&this.running&&(this.running=!1,this.renderer.setAnimationLoop(null)),this.reduced&&this.inView&&this.renderStill()}renderStill(){!this.running&&this.renderer&&this.compiled&&(this.isMorphing&&this.reduced&&this.finishMorph(),this.draw())}finishMorph(){let e=this.geometry.attributes.position;if(e.array.set(this.geometry.attributes.aTarget.array),e.needsUpdate=!0,this.material.uniforms.uMix.value=0,this.isMorphing=!1,this.morphTime=1,null!==this.pendingSkill){let e=this.pendingSkill;this.pendingSkill=null,this.loadSkill(e)}}animate(e){let t=Math.min((e-this.last)/1e3,.05);this.last=e,this.elapsed+=t;let i=this.material.uniforms;this.isMorphing&&(this.morphTime+=t*this.config.morphSpeed,this.morphTime>=1?this.finishMorph():i.uMix.value=this.morphTime*this.morphTime*(3-2*this.morphTime)),i.uMouseStrength.value+=(this.pointerActive-i.uMouseStrength.value)*Math.min(1,6*t),this.pointerActive&&(this.raycaster.setFromCamera(this.pointerNdc,this.camera),this.raycaster.ray.intersectPlane(this.plane,this.hit)&&(this.inverse.copy(this.particleSystem.matrixWorld).invert(),this.hit.applyMatrix4(this.inverse),i.uMouse.value.lerp(this.hit,Math.min(1,10*t))));let r=this.pointerActive?.35*this.pointerNdc.x:.2*Math.sin(.3*this.elapsed),s=this.pointerActive?-(.2*this.pointerNdc.y):0;this.tilt.x+=(s-this.tilt.x)*Math.min(1,3*t),this.tilt.y+=(r-this.tilt.y)*Math.min(1,3*t),this.particleSystem.rotation.set(this.tilt.x,this.tilt.y,0),i.uTime.value=this.elapsed,this.draw()}draw(){this.composer?this.composer.render():this.renderer.render(this.scene,this.camera)}onResize(){if(!this.container||!this.camera||!this.renderer)return;let e=this.container.clientWidth,t=this.container.clientHeight;if(!e||!t)return;this.camera.aspect=e/t,this.camera.updateProjectionMatrix(),this.renderer.setSize(e,t),this.composer?.setSize(e,t);let i=(this.isMobile?14:18)/this.camera.aspect;this.camera.position.z=this.isMobile?Math.min(Math.max(i,16),35):Math.max(20,Math.min(i,60)),this.renderStill()}destroy(){this.renderer?.setAnimationLoop(null),this.running=!1,this.io?.disconnect(),window.removeEventListener("resize",this.onResize),window.removeEventListener("pointermove",this.onPointerMove),document.removeEventListener("pointerleave",this.onPointerLeave),document.removeEventListener("visibilitychange",this.onVisibility),this.geometry?.dispose(),this.material?.dispose(),this.composer?.dispose?.(),this.renderer&&(this.renderer.dispose(),this.renderer.forceContextLoss(),this.renderer.domElement.remove()),this.geometry=null,this.renderer=null}}e.s(["SkillsParticleSystem",()=>b],49327)}]);