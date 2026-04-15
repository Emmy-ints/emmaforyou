import { useRef, useEffect } from "react";
import * as THREE from "three";

export default function HeroScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Torus
    const torusGeo = new THREE.TorusGeometry(1.8, 0.05, 32, 100);
    const torusMat = new THREE.MeshBasicMaterial({ color: 0x1e3fd8, wireframe: true, transparent: true, opacity: 0.4 });
    const torus = new THREE.Mesh(torusGeo, torusMat);
    scene.add(torus);

    // Second torus
    const torus2Geo = new THREE.TorusGeometry(2.2, 0.03, 32, 100);
    const torus2Mat = new THREE.MeshBasicMaterial({ color: 0xc2185b, wireframe: true, transparent: true, opacity: 0.25 });
    const torus2 = new THREE.Mesh(torus2Geo, torus2Mat);
    torus2.rotation.x = Math.PI / 3;
    scene.add(torus2);

    // Particles
    const particleCount = 300;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      // Gold-ish particles
      colors[i * 3] = 0.9 + Math.random() * 0.1;
      colors[i * 3 + 1] = 0.7 + Math.random() * 0.2;
      colors[i * 3 + 2] = 0.2 + Math.random() * 0.2;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const particleMat = new THREE.PointsMaterial({ size: 0.02, vertexColors: true, transparent: true, opacity: 0.7 });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      torus.rotation.x += 0.002;
      torus.rotation.y += 0.003;
      torus2.rotation.y -= 0.002;
      torus2.rotation.z += 0.001;
      particles.rotation.y += 0.0005;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 -z-10" />;
}
