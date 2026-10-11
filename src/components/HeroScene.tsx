import { Suspense, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Html, Lightformer, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Bot, Globe, Mail, Megaphone, ShoppingBag, Smartphone, Users } from 'lucide-react';
import { Button } from './ui/button';
import { useI18n } from '@/lib/i18n';
import { homeExperienceCopy, serviceAnchors } from '@/lib/home-experience-copy';

const icons = [Bot, Globe, Mail, Users, ShoppingBag, Smartphone, Megaphone];
type ScenePalette = { blue: string; purple: string; gold: string; card: string };
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

function ServiceTile({ index, reduced, palette }: { index: number; reduced: boolean; palette: ScenePalette }) {
 const ref = useRef<THREE.Group>(null);
 const [hovered, setHovered] = useState(false);
 const { lang } = useI18n(); const copy = homeExperienceCopy[lang];
 const Icon = icons[index]; const time = useRef(0);
 // Wide oval keeps tiles away from the core and readable at narrow widths.
 const angle = index / 7 * Math.PI * 2 + .22;
 const base: [number, number, number] = [Math.cos(angle) * 3.1, Math.sin(angle) * 1.62, .35];
 useFrame((_, delta) => {
  if (!ref.current || reduced) return;
  const dt = Math.min(delta, .05); time.current += dt;
  ref.current.position.x = base[0] + Math.sin(time.current * .18 + angle) * .13;
  ref.current.position.y = base[1] + Math.sin(time.current * .65 + index) * .09;
  ref.current.position.z = THREE.MathUtils.damp(ref.current.position.z, hovered ? 1.4 : base[2], 7, dt);
  ref.current.rotation.y = Math.sin(time.current * .35 + index) * .1;
 });
 return <group ref={ref} position={base}>
  <RoundedBox args={[1.32, .48, .12]} radius={.07} smoothness={3}>
   <meshStandardMaterial color={palette.card} metalness={.25} roughness={.3} />
  </RoundedBox>
  <Html center position={[0, 0, .1]} distanceFactor={8} zIndexRange={[20, 10]}>
   <div onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)}>
    <Button variant="outline" className="hero-service-tile" title={copy.descriptions[index]} onFocus={() => setHovered(true)} onBlur={() => setHovered(false)} onClick={() => document.getElementById(serviceAnchors[index])?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'center' })}>
     <Icon className="text-emma-blue" /><span>{copy.services[index]}</span>
    </Button>
    {hovered && <div role="tooltip" className="hero-service-description">{copy.descriptions[index]}</div>}
   </div>
  </Html>
 </group>;
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
  }; setPalette({ blue: get('--emma-blue'), purple: get('--emma-purple'), gold: get('--emma-gold'), card: get('--card') }); };
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
  {palette && <Canvas dpr={[1, 2]} frameloop={!visible ? 'never' : reduced ? 'demand' : 'always'} camera={{ position: [0, 0, 8.6], fov: 42 }} gl={{ alpha: true, antialias: true }}>
   <ambientLight intensity={.8} /><directionalLight position={[3, 4, 5]} intensity={2.2} />
   <Suspense fallback={null}>
    <Environment resolution={64}><Lightformer intensity={3} position={[0, 4, 2]} scale={[8, 8, 1]} /><Lightformer intensity={2} color={palette.gold} position={[-4, 0, 2]} scale={[3, 6, 1]} /></Environment>
    <group scale={mobile ? .72 : 1}><GrowthObject input={input} reduced={reduced} mobile={mobile} palette={palette} />{Array.from({ length: 7 }, (_, i) => <ServiceTile key={i} index={i} reduced={reduced} palette={palette} />)}</group>
   </Suspense>
  </Canvas>}
 </div>;
}
