import { useEffect, useRef, useState } from "react";
import { lowPower, prefersReduced } from "@/lib/motion";

/**
 * EmmaForYou's signature object: a liquid-glass orb, ray-marched live on the GPU (WebGL, no libraries).
 * It slowly morphs, catches iridescent light, turns towards the pointer and rotates with scroll.
 * Rendering pauses when it's off screen or the tab is hidden, runs at reduced resolution on small or
 * touch screens, and falls back to a CSS orb on low-power devices, reduced motion or without WebGL.
 */
const VERT = "attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }";
const FRAG = `precision highp float;
uniform vec2 uRes; uniform float uTime; uniform vec2 uPtr; uniform float uScroll;
mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float sdf(vec3 p){
  float t = uTime * 0.35;
  float d = length(p) - 1.0;
  d += 0.11 * sin(3.0 * p.x + t * 1.3) * sin(3.0 * p.y + t * 1.1) * sin(3.0 * p.z + t * 0.9);
  d += 0.045 * sin(6.0 * p.y - t * 2.0 + p.x * 2.0);
  return d * 0.8;
}
vec3 nrm(vec3 p){ vec2 e = vec2(0.002, 0.0); return normalize(vec3(sdf(p + e.xyy) - sdf(p - e.xyy), sdf(p + e.yxy) - sdf(p - e.yxy), sdf(p + e.yyx) - sdf(p - e.yyx))); }
vec3 pal(float t){ return 0.55 + 0.45 * cos(6.2831 * (vec3(0.62, 0.52, 0.42) * t + vec3(0.58, 0.68, 0.80))); }
void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);
  vec3 ro = vec3(0.0, 0.0, 5.6); vec3 rd = normalize(vec3(uv, -1.6));
  float ay = uPtr.x * 0.6 + uTime * 0.12 + uScroll * 1.4; float ax = uPtr.y * 0.4;
  ro.xz *= rot(ay); rd.xz *= rot(ay); ro.yz *= rot(ax); rd.yz *= rot(ax);
  float t = 0.0; float hit = 0.0; float glow = 0.0;
  for (int i = 0; i < 56; i++) {
    vec3 q = ro + rd * t; float d = sdf(q);
    glow += 0.012 / (0.02 + d * d);
    if (d < 0.002) { hit = 1.0; break; }
    t += d; if (t > 9.0) break;
  }
  vec3 col = vec3(0.0); float a = 0.0;
  if (hit > 0.5) {
    vec3 q = ro + rd * t; vec3 n = nrm(q); vec3 v = -rd;
    float fres = pow(1.0 - max(dot(n, v), 0.0), 2.2);
    vec3 l1 = normalize(vec3(0.6, 0.8, 0.5)); vec3 l2 = normalize(vec3(-0.7, -0.2, 0.4));
    float spec = pow(max(dot(reflect(-l1, n), v), 0.0), 48.0);
    float spec2 = pow(max(dot(reflect(-l2, n), v), 0.0), 24.0) * 0.5;
    vec3 base = mix(vec3(0.05, 0.06, 0.2), vec3(0.34, 0.29, 0.95), 0.5 + 0.5 * n.y);
    vec3 irid = pal(fres * 1.4 + dot(n, vec3(0.3, 0.5, 0.2)) + uTime * 0.05);
    col = base * 0.55 + irid * fres * 1.1 + vec3(1.0) * spec + vec3(0.6, 0.9, 1.0) * spec2;
    col += pal(n.x * 0.5 + 0.3) * 0.18 * (1.0 - fres);
    a = 0.95;
  }
  col += vec3(0.43, 0.36, 1.0) * glow * 0.018 * (1.0 - a);
  a = max(a, clamp(glow * 0.012, 0.0, 0.6));
  gl_FragColor = vec4(col * a, a);
}`;

function shader(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
  return s;
}

export default function FutureOrb({ className = "", label }: { className?: string; label?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"css" | "gl">("css");

  useEffect(() => {
    const el = host.current;
    if (!el || prefersReduced() || lowPower()) return;
    let cancelled = false; let raf = 0; let visible = true; let gl: WebGLRenderingContext | null = null;
    let canvas: HTMLCanvasElement | null = null;
    const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
    const start = performance.now();
    const coarse = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;

    const boot = () => {
      if (cancelled) return;
      canvas = document.createElement("canvas");
      canvas.setAttribute("aria-hidden", "true");
      gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: "low-power", preserveDrawingBuffer: false });
      if (!gl) return;
      let prog: WebGLProgram;
      try {
        prog = gl.createProgram()!;
        gl.attachShader(prog, shader(gl, gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, shader(gl, gl.FRAGMENT_SHADER, FRAG));
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error("link");
      } catch { return; }
      gl.useProgram(prog);
      const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const uRes = gl.getUniformLocation(prog, "uRes"), uTime = gl.getUniformLocation(prog, "uTime"), uPtr = gl.getUniformLocation(prog, "uPtr"), uScroll = gl.getUniformLocation(prog, "uScroll");
      el.appendChild(canvas);
      canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); cancelAnimationFrame(raf); canvas?.remove(); setMode("css"); }, { once: true });
      const resize = () => {
        if (!canvas || !gl) return;
        const scale = Math.min(window.devicePixelRatio || 1, 1.5) * (coarse ? 0.6 : 0.85);
        const w = Math.max(1, Math.round(el.clientWidth * scale)), h = Math.max(1, Math.round(el.clientHeight * scale));
        if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
      };
      resize();
      const ro = new ResizeObserver(resize); ro.observe(el);
      const frame = () => {
        raf = 0;
        if (!gl || !canvas || cancelled || !visible || document.hidden) return;
        ptr.x += (ptr.tx - ptr.x) * 0.06; ptr.y += (ptr.ty - ptr.y) * 0.06;
        gl.uniform2f(uRes, canvas.width, canvas.height);
        gl.uniform1f(uTime, (performance.now() - start) / 1000);
        gl.uniform2f(uPtr, ptr.x, ptr.y);
        gl.uniform1f(uScroll, Math.min(2, window.scrollY / Math.max(1, window.innerHeight)));
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        raf = requestAnimationFrame(frame);
      };
      const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(frame); }, { rootMargin: "120px" });
      io.observe(el);
      const onVis = () => { if (!document.hidden && visible && !raf) raf = requestAnimationFrame(frame); };
      document.addEventListener("visibilitychange", onVis);
      const onPtr = (e: PointerEvent) => { ptr.tx = (e.clientX / window.innerWidth) * 2 - 1; ptr.ty = (e.clientY / window.innerHeight) * 2 - 1; };
      window.addEventListener("pointermove", onPtr, { passive: true });
      setMode("gl");
      raf = requestAnimationFrame(frame);
      cleanup = () => {
        cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
        document.removeEventListener("visibilitychange", onVis); window.removeEventListener("pointermove", onPtr);
        gl?.getExtension("WEBGL_lose_context")?.loseContext(); canvas?.remove();
      };
    };
    let cleanup = () => {};
    // Start after the page has painted so the first content is never delayed by the GPU.
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    const handle = idle ? idle(boot, { timeout: 1200 }) : window.setTimeout(boot, 300);
    return () => { cancelled = true; if (!idle) window.clearTimeout(handle as number); cleanup(); };
  }, []);

  return (
    <div ref={host} className={`efy-orb ${className}`} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} data-mode={mode}>
      {mode === "css" && <div className="efy-orb-fallback" />}
    </div>
  );
}
