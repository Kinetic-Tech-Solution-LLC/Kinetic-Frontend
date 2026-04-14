"use client";

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';

/**
 * KineticLogo3D: The High-Fidelity 3D Brand Signature
 * 
 * Featured in the V1.5.0 Modernization Update.
 * Logic Highlights:
 * - Magnetic Tilt: Smooth interpolation of mouse vectors for responsive interaction.
 * - Energy Orbits: Layered Torus geometry with dynamic rotation logic.
 * - Vertex Energy: Shader-like emissive intensity management via GSAP.
 */
export default function KineticLogo3D({ size = 280 }: { size?: number }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.z = 6.5;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Glowing K geometry
    const kGroup = new THREE.Group();

    // Precise "K" shape geometry
    const shape = new THREE.Shape();
    // Vertical stem
    shape.moveTo(-1, 1.5);
    shape.lineTo(-0.4, 1.5);
    shape.lineTo(-0.4, 0.3);
    
    // Top leg slant
    shape.lineTo(0.6, 1.5);
    shape.lineTo(1.2, 1.5);
    shape.lineTo(0.1, 0);
    
    // Bottom leg slant
    shape.lineTo(1.2, -1.5);
    shape.lineTo(0.6, -1.5);
    shape.lineTo(-0.4, -0.3);
    
    // Bottom stem finish
    shape.lineTo(-0.4, -1.5);
    shape.lineTo(-1, -1.5);
    shape.closePath();

    const extrudeSettings = { depth: 0.3, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05 };
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center();

    const material = new THREE.MeshPhongMaterial({
      color: 0x22d3ee,
      emissive: 0x22d3ee,
      emissiveIntensity: 1.2,
      shininess: 100,
      transparent: true,
      opacity: 0.9,
    });

    const kMesh = new THREE.Mesh(geometry, material);
    kGroup.add(kMesh);

    // Energy Orbits (Liquid Rings)
    const orbits = new THREE.Group();
    const orbitColors = [0x22d3ee, 0x67e8f9, 0xa5f3fc];
    
    for (let i = 0; i < 3; i++) {
      const ringGeom = new THREE.TorusGeometry(1.6 + i * 0.2, 0.008, 16, 100);
      const ringMat = new THREE.MeshPhongMaterial({
        color: orbitColors[i],
        emissive: orbitColors[i],
        emissiveIntensity: 1,
        transparent: true,
        opacity: 0.4,
      });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.rotation.x = Math.random() * Math.PI;
      ring.rotation.y = Math.random() * Math.PI;
      orbits.add(ring);
    }
    kGroup.add(orbits);

    // Initial scale adjustment 
    kGroup.scale.set(0.65, 0.65, 0.65); 
    scene.add(kGroup);

    // Lights
    const pointLight = new THREE.PointLight(0x22d3ee, 12, 15);
    pointLight.position.set(2, 2, 2);
    scene.add(pointLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    let isHovering = false;
    let time = 0;
    let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      targetX = x * 0.4;
      targetY = y * 0.4;
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);

    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      time += 0.01;

      mouseX = THREE.MathUtils.lerp(mouseX, targetX, 0.05);
      mouseY = THREE.MathUtils.lerp(mouseY, targetY, 0.05);

      const pulse = 1 + Math.sin(time * 2) * 0.02;
      kMesh.scale.set(pulse, pulse, pulse);
      
      kGroup.rotation.y = mouseX + (isHovering ? time * 2 : time * 0.2);
      kGroup.rotation.x = -mouseY + Math.sin(time * 0.5) * 0.1;
      
      orbits.rotation.z += isHovering ? 0.01 : 0.002;

      orbits.children.forEach((child, idx) => {
        child.rotation.x += 0.005 * (idx + 1);
        child.rotation.y += 0.003 * (idx + 1);
      });

      renderer.render(scene, camera);
    };

    animate();

    const container = mountRef.current;
    
    const handleMouseEnter = () => {
      isHovering = true;
      gsap.to(kGroup.scale, { x: 1.65, y: 1.65, z: 1.65, duration: 0.8, ease: "expo.out" });
    };

    const handleMouseLeave = () => {
      isHovering = false;
      targetX = 0; 
      targetY = 0;
      gsap.to(kGroup.scale, { x: 0.65, y: 0.65, z: 0.65, duration: 1.2, ease: "elastic.out(1, 0.7)" });
    };

    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
      renderer.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [size]);

  return (
    <div
      ref={mountRef}
      className="cursor-pointer transition-all duration-300 flex items-center justify-center relative"
      style={{ width: size, height: size }}
    />
  );
}
