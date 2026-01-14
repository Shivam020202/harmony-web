import * as THREE from "three";

// --- Configuration ---
const CONFIG = {
  colors: {
    // FIXED PALETTE (Optimized Lightness)
    primary: new THREE.Color("#384B29"),
    secondary: new THREE.Color("#556B40"),
    accent: new THREE.Color("#D97236"),
    highlight: new THREE.Color("#F2F5EC"),
  },
  speed: 0.15,
  mouseInfluence: 0.8,
};

const vertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const fragmentShader = `
    uniform float uTime;
    uniform vec2 uResolution;
    uniform vec2 uMouse;
    
    uniform vec3 uColorPrimary;
    uniform vec3 uColorSecondary;
    uniform vec3 uColorAccent;
    uniform vec3 uColorHighlight;

    varying vec2 vUv;

    // --- Noise Functions ---
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i  = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min( g.xyz, l.zxy );
        vec3 i2 = max( g.xyz, l.zxy );
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy; 
        vec3 x3 = x0 - D.yyy;      
        i = mod289(i); 
        vec4 p = permute( permute( permute( 
                    i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
                + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
        float n_ = 1.0/7.0; 
        vec3  ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z); 
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_ ); 
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4( x.xy, y.xy );
        vec4 b1 = vec4( x.zw, y.zw );
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                    dot(p2,x2), dot(p3,x3) ) );
    }
    
    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    void main() {
        vec2 uv = vUv;
        float aspect = uResolution.x / uResolution.y;
        uv.x *= aspect;
        
        vec2 mouse = uMouse;
        mouse.x *= aspect;
        mouse.y = 1.0 - mouse.y;
        
        float t = uTime * 0.12;
        
        // Mouse Interaction
        float d = distance(uv, mouse);
        float interaction = smoothstep(0.45, 0.0, d);
        
        // Combine distortions
        float distAmt = interaction * 0.5;

        // --- DOMAIN WARPING ---
        vec2 q = vec2(0.);
        q.x = snoise(vec3(uv, t));
        q.y = snoise(vec3(uv + vec2(1.0), t));

        vec2 r = vec2(0.);
        r.x = snoise(vec3(uv + 1.0 * q + vec2(1.7, 9.2) + 0.15*t + distAmt, t));
        r.y = snoise(vec3(uv + 1.0 * q + vec2(8.3, 2.8) + 0.126*t, t));

        float f = snoise(vec3(uv + r, t));

        // --- COLOR MIXING ---
        
        vec3 finalColor = uColorPrimary;
        
        float secondaryMix = smoothstep(0.2, 1.0, f); 
        finalColor = mix(finalColor, uColorSecondary, secondaryMix * 0.7);

        // Orange Veins
        float accentNoise = snoise(vec3(uv * 2.0 + r, t * 1.5));
        float accentMask = smoothstep(0.6, 0.65, accentNoise) * 0.2; 
        
        // React to Mouse
        accentMask += interaction * 0.4 * smoothstep(0.2, 0.7, accentNoise);
        
        finalColor = mix(finalColor, uColorAccent, clamp(accentMask, 0.0, 1.0));

        // Highlights
        float highlightMask = smoothstep(0.7, 0.95, f);
        
        finalColor = mix(finalColor, uColorHighlight, highlightMask * 0.3);

        // --- TEXTURE ---
        float grain = random(uv * uTime) * 0.08;
        finalColor += grain - 0.04;

        // Soft Vignette
        float vignette = length(vUv - 0.5);
        vec3 darkEdge = uColorPrimary * 0.4;
        finalColor = mix(finalColor, darkEdge, vignette * 0.4);

        gl_FragColor = vec4(finalColor, 1.0);
    }
`;

function init() {
  const container = document.getElementById("hero-canvas");
  if (!container) return; // Guard clause in case element isn't found

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });

  // Size to container, not window, if containerised?
  // User asked for "containerised from left right and bottom".
  // The container will likely be sized by CSS (mx-4 etc).
  // So we should size renderer to the container's clientWidth/Height.
  // However, if we use window size, it might be safer for full screen feel within the clip.
  // But let's try to fit the container.
  // For now, let's use window size but check if we should stick to container.
  // Actually, `window.innerWidth` is usually fine if we want high res, but `container.clientWidth` is better for strict layout.
  // BUT, the shader uses `uResolution` for aspect ratio.
  // Let's use container dimensions.

  const updateSize = () => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    renderer.setSize(width, height);
    uniforms.uResolution.value.set(width, height);
  };

  // Initial size might be 0 if DOM not ready or layout not computed, so we might need to wait or rely on resize.
  // We'll call updateSize() at start.

  // Optimize: Lower pixel ratio for full-screen shader performance
  const pixelRatio = Math.min(window.devicePixelRatio, 1.5); // Cap at 1.5 instead of 2
  renderer.setPixelRatio(pixelRatio > 1 ? 1 : pixelRatio); // Actually, let's just force 1.0 for now for max performance
  renderer.setPixelRatio(1);

  container.appendChild(renderer.domElement);

  const geometry = new THREE.PlaneGeometry(2, 2);
  const mousePos = new THREE.Vector2(0.5, 0.5);

  const uniforms = {
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uMouse: { value: mousePos },
    // Colors
    uColorPrimary: { value: CONFIG.colors.primary },
    uColorSecondary: { value: CONFIG.colors.secondary },
    uColorAccent: { value: CONFIG.colors.accent },
    uColorHighlight: { value: CONFIG.colors.highlight },
  };

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
  });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // Helpers
  const updateMouse = (x, y) => {
    const rect = container.getBoundingClientRect();
    const cx = x - rect.left;
    const cy = y - rect.top;
    mousePos.x = cx / rect.width;
    mousePos.y = cy / rect.height;
  };

  // Event Listeners (Throttled slightly naturally by frame/event loop)
  document.addEventListener("mousemove", (e) =>
    updateMouse(e.clientX, e.clientY)
  );
  document.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches.length)
        updateMouse(e.touches[0].clientX, e.touches[0].clientY);
    },
    { passive: true }
  );

  window.addEventListener("resize", updateSize);
  updateSize();

  // Animation Loop - Optimized with Intersection Observer
  // Only animate when visible!
  let isVisible = true;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        isVisible = entry.isIntersecting;
      });
    },
    { threshold: 0 }
  );
  observer.observe(container);

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    if (isVisible) {
      uniforms.uTime.value = clock.getElapsedTime() * CONFIG.speed;
      renderer.render(scene, camera);
    }
  }
  animate();
}

init();
