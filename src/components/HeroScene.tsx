import { Suspense, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Bot, Globe, Mail, Megaphone, ShoppingBag, Smartphone, Users } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { homeExperienceCopy, serviceAnchors } from '@/lib/home-experience-copy';
import { track } from '@/lib/analytics';

const icons = [Bot, Globe, Mail, Users, ShoppingBag, Smartphone, Megaphone];
type ScenePalette = { blue: string; purple: string; gold: string };
type Input = { x: number; y: number; dragX: number; dragY: number; dragging: boolean; lastX: number; lastY: number; progress: number };

function GrowthObject({ input, reduced, mobile, palette }: { input: RefObject<Input>; reduced: boolean; mobile: boolean; palette: ScenePalette }) {
 const group = useRef<THREE.Group>(null);
 const mesh = useRef<THREE.Mesh>(null);
 const particles = useRef<THREE.Points>(null);
 const time = useRef(0);
 const bases = useMemo(() => {
  const n = mobile ? 220 : 650;
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
   const y = 1 - (i / (n - 1)) * 2;
   const radius = Math.sqrt(1 - y * y);
   const theta = i * Math.PI * (3 - Math.sqrt(5));
   a.set([Math.cos(theta) * radius * 1.45, y * 1.45, Math.sin(theta) * radius * 1.45], i * 3);
  }
  return a;
 }, [mobile]);
 const positions = useMemo(() => bases.slice(), [bases]);
 useFrame((_, delta) => {
  if (!group.current || reduced) return;
  const dt = Math.min(delta, .05); time.current += dt;
  const target = input.current;
  group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, target.y * .15 + target.dragY, 4, dt);
  group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, target.x * .2 + target.dragX + time.current * .08 + target.progress * .6, 4, dt);
  group.current.scale.setScalar(1 + target.progress * .15);
  if (mesh.current) mesh.current.scale.setScalar(1 + Math.sin(time.current * 1.5) * .045);
  const p = particles.current?.geometry.getAttribute('position');
  if (p) {
   for (let i = 0; i < p.count; i++) {
    const k = i * 3, x = bases[k], y = bases[k + 1], z = bases[k + 2];
    const distance = Math.hypot(x - target.x * 2, y - target.y * 2);
    const ripple = 1 + .035 * Math.sin(time.current * 2 + y * 4) + (z > 0 ? Math.max(0, 1 - distance) * .3 : 0);
    p.setXYZ(i, x * ripple, y * ripple, z * ripple);
   }
   p.needsUpdate = true;
  }
 });
 return <group ref={group}>
  <mesh ref={mesh}>
   <icosahedronGeometry args={[1.13, 1]} />
   <meshPhysicalMaterial color={palette.blue} metalness={.65} roughness={.25} clearcoat={1} emissive={palette.purple} emissiveIntensity={.17} flatShading />
  </mesh>
  <mesh scale={1.04}>
   <icosahedronGeometry args={[1.23, 1]} />
   <meshBasicMaterial color={palette.gold} wireframe transparent opacity={.55} />
  </mesh>
  <points ref={particles}>
   <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
   <pointsMaterial color={palette.gold} size={mobile ? .035 : .025} transparent opacity={.9} sizeAttenuation />
  </points>
 </group>;
}

/**
 * Service tiles orbit the sculpture as real DOM buttons, projected onto a tilted ellipse each frame.
 * Tiles on the far side of the orbit shrink, fade and pass behind the orb, which gives true depth while
 * staying crisp, tappable and readable by screen readers. Hovering or focusing a tile pauses the orbit.
 */
function OrbitTiles({ input, reduced, mobile, active }: { input: RefObject<Input>; reduced: boolean; mobile: boolean; active: boolean }) {
 const layer = useRef<HTMLDivElement>(null);
 const tiles = useRef<(HTMLDivElement | null)[]>([]);
 const [hovered, setHovered] = useState<number | null>(null);
 const hoveredRef = useRef<number | null>(null);
 const { lang } = useI18n(); const copy = homeExperienceCopy[lang];
 hoveredRef.current = hovered;

 useEffect(() => {
  const el = layer.current; if (!el) return;
  let raf = 0; let last = performance.now(); let spin = 0;
  const place = () => {
   const w = el.clientWidth, h = el.clientHeight;
   // Keep every tile fully on screen: on phones the orbit is bounded by half the width minus a tile's half-width.
   const rx = mobile ? Math.max(90, w / 2 - 74) : Math.min(w * 0.4, 430);
   const ry = Math.min(h * 0.3, 120);
   const n = tiles.current.length;
   const p = input.current;
   tiles.current.forEach((tile, i) => {
    if (!tile) return;
    const a = (i / n) * Math.PI * 2 + spin + p.dragX * 0.6 + p.x * 0.35;
    const depth = Math.sin(a); // -1 = far side, 1 = near side
    const x = Math.cos(a) * rx;
    const y = depth * ry + Math.sin(spin * 2.2 + i) * 4 - p.y * 10;
    const near = (depth + 1) / 2;
    const isHovered = hoveredRef.current === i;
    const scale = isHovered ? 1.1 : 0.78 + near * 0.26;
    tile.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
    tile.style.opacity = String(isHovered ? 1 : (0.5 + near * 0.5).toFixed(3));
    tile.style.zIndex = isHovered ? '6' : depth > -0.15 ? '4' : '1';
    tile.style.filter = depth < -0.2 && !isHovered ? `blur(${((-depth - 0.2) * 1.2).toFixed(2)}px)` : 'none';
   });
  };
  const loop = (now: number) => {
   const dt = Math.min((now - last) / 1000, 0.05); last = now;
   if (hoveredRef.current === null) spin += dt * 0.16;
   place();
   raf = requestAnimationFrame(loop);
  };
  place();
  if (!reduced && active) raf = requestAnimationFrame(loop);
  const onResize = () => place();
  window.addEventListener('resize', onResize);
  return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
 }, [input, reduced, mobile, active]);

 return <div ref={layer} className="hero-orbit">
  {copy.services.map((label, index) => {
   const Icon = icons[index];
   return <div key={index} ref={(node) => { tiles.current[index] = node; }} className="hero-orbit-tile"
    onPointerEnter={() => setHovered(index)} onPointerLeave={() => setHovered((h) => (h === index ? null : h))}>
    <button type="button" className="hero-service-tile" aria-describedby={hovered === index ? `svc-desc-${index}` : undefined}
     onFocus={() => setHovered(index)} onBlur={() => setHovered((h) => (h === index ? null : h))}
     onClick={() => { track('service_tile_click', { service: serviceAnchors[index] }); document.getElementById(serviceAnchors[index])?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' }); }}>
     <Icon aria-hidden="true" /><span>{label}</span>
    </button>
    {hovered === index && <div id={`svc-desc-${index}`} role="tooltip" className="hero-service-description">{copy.descriptions[index]}</div>}
   </div>;
  })}
 </div>;
}

export default function HeroScene() {
 const mount = useRef<HTMLDivElement>(null);
 const input = useRef<Input>({ x: 0, y: 0, dragX: 0, dragY: 0, dragging: false, lastX: 0, lastY: 0, progress: 0 });
 const [visible, setVisible] = useState(true);
 const [reduced, setReduced] = useState(false);
 const [mobile, setMobile] = useState(false);
 const [palette, setPalette] = useState<ScenePalette | null>(null);
 useEffect(() => {
  const el = mount.current; if (!el) return;
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const small = matchMedia('(max-width: 767px)');
  const sync = () => { setReduced(media.matches); setMobile(small.matches); };
  sync(); media.addEventListener('change', sync); small.addEventListener('change', sync);
  const colors = () => { const css = getComputedStyle(document.documentElement); const get = (name: string) => {
   // Canvas resolves semantic CSS colors to an sRGB color accepted by Three.js.
   const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
   if (!ctx) return 'transparent'; ctx.fillStyle = css.getPropertyValue(name).trim(); ctx.fillRect(0, 0, 1, 1); const p = ctx.getImageData(0, 0, 1, 1).data; return `rgb(${p[0]},${p[1]},${p[2]})`;
  }; setPalette({ blue: get('--emma-blue'), purple: get('--emma-purple'), gold: get('--emma-gold') }); };
  colors(); const theme = new MutationObserver(colors); theme.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  let intersecting = true;
  const updateVisible = () => setVisible(intersecting && !document.hidden);
  const observer = new IntersectionObserver(([entry]) => { intersecting = entry.isIntersecting; updateVisible(); }); observer.observe(el);
  document.addEventListener('visibilitychange', updateVisible);
  gsap.registerPlugin(ScrollTrigger);
  const trigger = media.matches ? null : ScrollTrigger.create({ trigger: el.closest('section'), start: 'top top', end: 'bottom top', onUpdate: (self) => { input.current.progress = self.progress; } });
  return () => { observer.disconnect(); theme.disconnect(); trigger?.kill(); document.removeEventListener('visibilitychange', updateVisible); media.removeEventListener('change', sync); small.removeEventListener('change', sync); };
 }, []);
 return <div ref={mount} className="hero-scene" aria-label="Interactive growth sculpture" onPointerDown={(e) => { if (reduced || (e.target as HTMLElement).closest('button')) return; input.current.dragging = true; input.current.lastX = e.clientX; input.current.lastY = e.clientY; e.currentTarget.setPointerCapture(e.pointerId); }} onPointerMove={(e) => {
  const r = e.currentTarget.getBoundingClientRect(); const p = input.current;
  p.x = (e.clientX - r.left) / r.width * 2 - 1; p.y = -((e.clientY - r.top) / r.height * 2 - 1);
  if (p.dragging) { p.dragX += (e.clientX - p.lastX) * .008; p.dragY += (e.clientY - p.lastY) * .008; p.lastX = e.clientX; p.lastY = e.clientY; }
 }} onPointerUp={() => { input.current.dragging = false; }} onPointerCancel={() => { input.current.dragging = false; }}>
  <div className="hero-canvas">
   {palette && <Canvas dpr={[1, 2]} frameloop={!visible ? 'never' : reduced ? 'demand' : 'always'} camera={{ position: [0, 0, 7.2], fov: 40 }} gl={{ alpha: true, antialias: true }}>
    <ambientLight intensity={.8} /><directionalLight position={[3, 4, 5]} intensity={2.2} />
    <Suspense fallback={null}>
     <Environment resolution={64}><Lightformer intensity={3} position={[0, 4, 2]} scale={[8, 8, 1]} /><Lightformer intensity={2} color={palette.gold} position={[-4, 0, 2]} scale={[3, 6, 1]} /></Environment>
     <group scale={mobile ? .8 : 1}><GrowthObject input={input} reduced={reduced} mobile={mobile} palette={palette} /></group>
    </Suspense>
   </Canvas>}
  </div>
  <OrbitTiles input={input} reduced={reduced} mobile={mobile} active={visible} />
 </div>;
}
