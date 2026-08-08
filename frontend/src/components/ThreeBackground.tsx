'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 15, 35);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // Light setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x6366f1, 3, 60);
    pointLight1.position.set(10, 20, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xa855f7, 3, 60);
    pointLight2.position.set(-10, -10, -10);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0x06b6d4, 2, 50);
    pointLight3.position.set(0, 10, -20);
    scene.add(pointLight3);

    // 1. Particle Grid Wave (Guillaume Gouessan Style)
    const gridX = 75;
    const gridZ = 75;
    const numParticles = gridX * gridZ;
    const positions = new Float32Array(numParticles * 3);
    const colors = new Float32Array(numParticles * 3);
    const scales = new Float32Array(numParticles);

    const color1 = new THREE.Color(0x6366f1); // Indigo
    const color2 = new THREE.Color(0xa855f7); // Violet
    const color3 = new THREE.Color(0x06b6d4); // Cyan

    let idx = 0;
    for (let ix = 0; ix < gridX; ix++) {
      for (let iz = 0; iz < gridZ; iz++) {
        const x = (ix - gridX / 2) * 1.4;
        const z = (iz - gridZ / 2) * 1.4;
        positions[idx * 3] = x;
        positions[idx * 3 + 1] = 0;
        positions[idx * 3 + 2] = z;

        // Mix color gradient based on distance from center
        const dist = Math.sqrt(x * x + z * z);
        const mixFactor = Math.min(dist / 40, 1);
        const mixedColor = color1.clone().lerp(mixFactor > 0.5 ? color2 : color3, mixFactor);

        colors[idx * 3] = mixedColor.r;
        colors[idx * 3 + 1] = mixedColor.g;
        colors[idx * 3 + 2] = mixedColor.b;

        scales[idx] = 1.0;
        idx++;
      }
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Custom Particle Texture
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.3, 'rgba(168,85,247,0.8)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(16, 16, 16, 0, Math.PI * 2);
      ctx.fill();
    }
    const particleTexture = new THREE.CanvasTexture(canvas);

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.8,
      vertexColors: true,
      map: particleTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    particleSystem.position.y = -12;
    scene.add(particleSystem);

    // 2. Floating 3D Geometric Torus Knot (Guillaume Gouessan signature 3D accent)
    const torusKnotGeo = new THREE.TorusKnotGeometry(4.5, 1.2, 128, 32);
    const torusKnotMat = new THREE.MeshStandardMaterial({
      color: 0x6366f1,
      roughness: 0.1,
      metalness: 0.8,
      wireframe: true,
      emissive: 0x4338ca,
      emissiveIntensity: 0.5,
    });
    const torusKnot = new THREE.Mesh(torusKnotGeo, torusKnotMat);
    torusKnot.position.set(16, 6, -10);
    scene.add(torusKnot);

    // 3. Floating Glass Crystal Sphere
    const crystalGeo = new THREE.IcosahedronGeometry(3.5, 2);
    const crystalMat = new THREE.MeshPhysicalMaterial({
      color: 0xa855f7,
      roughness: 0.2,
      metalness: 0.1,
      transmission: 0.9,
      ior: 1.5,
      thickness: 1.2,
      wireframe: false,
    });
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    crystal.position.set(-18, 2, -8);
    scene.add(crystal);

    // Wireframe overlay on crystal
    const crystalWireMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.4,
    });
    const crystalWire = new THREE.Mesh(crystalGeo, crystalWireMat);
    crystal.add(crystalWire);

    // 4. Ambient Floating Dust Particles
    const dustCount = 300;
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount * 3; i += 3) {
      dustPos[i] = (Math.random() - 0.5) * 80;
      dustPos[i + 1] = (Math.random() - 0.5) * 60;
      dustPos[i + 2] = (Math.random() - 0.5) * 60;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      size: 0.35,
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const dustSystem = new THREE.Points(dustGeo, dustMat);
    scene.add(dustSystem);

    // Mouse Tracking & Interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Scroll Tracking
    let scrollY = 0;
    const handleScroll = () => {
      scrollY = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll);

    // Window Resize Handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse interpolation
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      // Rotate 3D floating geometries
      torusKnot.rotation.x = elapsedTime * 0.3;
      torusKnot.rotation.y = elapsedTime * 0.4;
      torusKnot.position.y = 6 + Math.sin(elapsedTime * 1.5) * 1.2;

      crystal.rotation.x = elapsedTime * -0.2;
      crystal.rotation.y = elapsedTime * 0.3;
      crystal.position.y = 2 + Math.cos(elapsedTime * 1.2) * 1.5;

      dustSystem.rotation.y = elapsedTime * 0.03;

      // Animate Particle Grid Wave
      const posAttr = particleGeometry.attributes.position as THREE.BufferAttribute;
      const array = posAttr.array as Float32Array;

      let pIdx = 0;
      for (let ix = 0; ix < gridX; ix++) {
        for (let iz = 0; iz < gridZ; iz++) {
          const u = ix / gridX;
          const v = iz / gridZ;
          const wave1 = Math.sin(u * 8 + elapsedTime * 1.5) * 1.5;
          const wave2 = Math.cos(v * 8 + elapsedTime * 1.8) * 1.5;
          const wave3 = Math.sin((u + v) * 5 + elapsedTime * 2) * 1.0;

          // Mouse distortion on particle height
          const posX = array[pIdx * 3];
          const posZ = array[pIdx * 3 + 2];
          const distToMouse = Math.sqrt(
            Math.pow(posX - mouseX * 25, 2) + Math.pow(posZ - mouseY * 25, 2)
          );
          const mouseRipple = Math.max(0, 1 - distToMouse / 15) * 4;

          array[pIdx * 3 + 1] = wave1 + wave2 + wave3 + mouseRipple;
          pIdx++;
        }
      }
      posAttr.needsUpdate = true;

      // Camera parallax & scroll motion
      const scrollFactor = Math.min(scrollY / 1000, 3);
      camera.position.x = mouseX * 4;
      camera.position.y = 15 - mouseY * 3 - scrollFactor * 2;
      camera.position.z = 35 - scrollFactor * 5;
      camera.lookAt(0, -scrollFactor * 2, 0);

      // Light animation
      pointLight1.position.x = Math.sin(elapsedTime) * 20;
      pointLight1.position.z = Math.cos(elapsedTime) * 20;
      pointLight2.position.x = Math.cos(elapsedTime * 0.8) * 20;
      pointLight2.position.z = Math.sin(elapsedTime * 0.8) * 20;

      renderer.render(scene, camera);
    };

    animate();

    // Teardown
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);

      particleGeometry.dispose();
      particleMaterial.dispose();
      torusKnotGeo.dispose();
      torusKnotMat.dispose();
      crystalGeo.dispose();
      crystalMat.dispose();
      crystalWireMat.dispose();
      dustGeo.dispose();
      dustMat.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-80"
      style={{ filter: 'contrast(1.1) brightness(1.05)' }}
    />
  );
}
