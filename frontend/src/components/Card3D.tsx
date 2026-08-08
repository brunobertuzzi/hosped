'use client';

import React, { useRef, useState } from 'react';

interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  glareColor?: string;
  glowOnHover?: boolean;
}

export default function Card3D({
  children,
  className = '',
  onClick,
  glareColor = 'rgba(99, 102, 241, 0.25)',
  glowOnHover = true,
}: Card3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -8; // max 8 deg tilt
    const rotateY = ((x - centerX) / centerX) * 8;

    setTransform(
      `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`
    );

    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;
    setGlarePos({ x: glareX, y: glareY, opacity: 1 });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    setGlarePos((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform,
        transition: isHovered
          ? 'transform 0.1s cubic-bezier(0.1, 1, 0.1, 1), box-shadow 0.3s ease, border-color 0.3s ease'
          : 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s ease, border-color 0.5s ease',
        transformStyle: 'preserve-3d',
      }}
      className={`relative overflow-hidden rounded-3xl backdrop-blur-xl border border-white/10 bg-[#080811]/70 transition-all cursor-pointer ${
        glowOnHover && isHovered
          ? 'border-indigo-500/40 shadow-[0_0_40px_-5px_rgba(99,102,241,0.3)]'
          : 'shadow-[0_10px_30px_-15px_rgba(0,0,0,0.8)]'
      } ${className}`}
    >
      {/* Glare / Reflective Spotlight effect */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300 z-20 rounded-3xl"
        style={{
          opacity: glarePos.opacity,
          background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, ${glareColor} 0%, transparent 65%)`,
        }}
      />

      {/* Subtle border highlight line */}
      <div
        className="pointer-events-none absolute inset-0 rounded-3xl border border-white/5 transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0.4,
          background: isHovered
            ? `radial-gradient(800px circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.08), transparent 40%)`
            : 'none',
        }}
      />

      {/* Card Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
