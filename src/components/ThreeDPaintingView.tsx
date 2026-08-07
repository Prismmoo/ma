import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Cuboid as Cube, Rotate3d, Layers, Play, Pause, Compass, Flame } from 'lucide-react';
import { subscribeCoverClock } from '../lib/coverRotationClock';

export default function ThreeDPaintingView() {
  const [rotation, setRotation] = useState({ x: 10, y: -15 });
  const [isExploded, setIsExploded] = useState(false);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  // Auto rotation loop synchronized to global cover clock
  useEffect(() => {
    if (!isAutoRotating) return;
    let angle = -15;
    return subscribeCoverClock(() => {
      angle = (angle + 1) % 360;
      setRotation((prev) => ({
        ...prev,
        y: angle,
        x: 8 + Math.sin(angle * (Math.PI / 180)) * 5,
      }));
    });
  }, [isAutoRotating]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isAutoRotating) setIsAutoRotating(false);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setRotation({
      x: -y / 9,
      y: x / 9,
    });
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 10, y: -15 });
  };

  // Z-offsets for 3D explosion effect with smooth soft depth
  const layerZ = isExploded
    ? { layer1: -50, layer2: 35, layer3: 95, layer4: 155, layer5: 220 }
    : { layer1: -15, layer2: 20, layer3: 45, layer4: 70, layer5: 100 };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center bg-[#EAE9F6] text-[#12131A] px-4 py-10 relative overflow-hidden select-none font-sans">
      {/* ── Background Soft Website Ambient Light Gradients ── */}
      <div 
        className="absolute inset-0 opacity-60 pointer-events-none transition-all duration-700"
        style={{
          background: `radial-gradient(650px circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(121, 82, 243, 0.18), rgba(66, 133, 244, 0.12) 45%, transparent 80%)`,
        }}
      />
      
      {/* Soft Ambient Purple/Blue Glowing Orbs */}
      <div className="absolute w-[550px] h-[550px] bg-gradient-to-tr from-[#7952F3]/20 via-[#4285F4]/15 to-[#EDE8FF] rounded-full blur-[130px] pointer-events-none animate-pulse" />
      <div className="absolute w-[380px] h-[380px] bg-[#7952F3]/15 rounded-full blur-[100px] pointer-events-none -bottom-10 -right-10" />

      {/* Floating Soft Ambient Spheres */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/70 border border-[#7952F3]/20 shadow-md backdrop-blur-sm"
            style={{
              width: `${(i % 3) * 6 + 8}px`,
              height: `${(i % 3) * 6 + 8}px`,
              left: `${(i * 9 + 6) % 92}%`,
              top: `${(i * 12 + 8) % 88}%`,
            }}
            animate={{
              y: [0, -25, 0],
              x: [0, (i % 2 === 0 ? 12 : -12), 0],
              opacity: [0.3, 0.85, 0.3],
              scale: [1, 1.25, 1],
            }}
            transition={{
              duration: 4.5 + (i % 4),
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.4,
            }}
          />
        ))}
      </div>

      {/* ── Top Header Soft Badge ── */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center text-center mb-6 relative z-10"
      >
        <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-white/80 border border-white text-[#4A32B8] text-xs font-semibold tracking-wider uppercase shadow-[0_8px_24px_rgba(180,185,210,0.35)] backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-[#7952F3] animate-spin" style={{ animationDuration: '6s' }} />
          <span>3D PAINTING ATELIER</span>
          <span className="w-2.5 h-2.5 rounded-full bg-[#7952F3] animate-ping" />
        </div>
      </motion.div>

      {/* ── Main Interactive Soft 3D Canvas Stage ── */}
      <div
        className="relative w-full max-w-lg aspect-[4/3] cursor-grab active:cursor-grabbing my-4 z-10"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ perspective: '1400px' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="w-full h-full relative rounded-[2.5rem] border border-white/90 bg-gradient-to-b from-white/95 via-white/85 to-[#EDEDF6]/90 p-5 shadow-[0_25px_60px_rgba(180,185,210,0.45)] backdrop-blur-xl transition-transform duration-100 ease-out"
          style={{
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Soft Purple Gloss Edge Glow */}
          <div className="absolute -inset-1 rounded-[2.6rem] bg-gradient-to-r from-[#7952F3]/30 via-[#4285F4]/20 to-[#7952F3]/30 opacity-70 blur-md animate-pulse pointer-events-none" />

          {/* ── Inner Soft 3D Stage Canvas ── */}
          <div className="relative w-full h-full rounded-[2rem] overflow-hidden border border-white/80 bg-gradient-to-br from-[#12131A] via-[#1A1829] to-[#2C214D] flex flex-col items-center justify-center p-6 text-center shadow-inner preserve-3d">

            {/* Layer 0: Dynamic Light Reflection Highlight */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-40 transition-opacity duration-300"
              style={{
                background: `radial-gradient(380px circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(255, 255, 255, 0.25), transparent 70%)`,
                transform: `translateZ(${layerZ.layer1}px)`,
              }}
            />

            {/* Layer 1: Volumetric Soft Grid Pattern */}
            <div 
              className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0c_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0c_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none transition-transform duration-500 ease-out"
              style={{ transform: `translateZ(${layerZ.layer1}px)` }}
            />

            {/* Layer 2: Floating Soft Translucent Glass Panel */}
            <div 
              className="absolute inset-5 border border-white/20 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-black/40 backdrop-blur-[3px] pointer-events-none transition-transform duration-500 ease-out shadow-xl"
              style={{ 
                transform: `translateZ(${layerZ.layer2}px)`,
                boxShadow: isExploded ? '0 18px 40px rgba(121,82,243,0.3)' : '0 10px 25px rgba(0,0,0,0.4)'
              }}
            >
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/15 border border-white/30 text-[9px] font-mono text-white tracking-widest uppercase backdrop-blur-md">
                VOLUMETRIC RELIEF
              </div>
            </div>

            {/* Layer 3: Floating Purple/Blue Hologram Soft Ring */}
            <div 
              className="absolute inset-9 border border-[#7952F3]/40 rounded-2xl pointer-events-none transition-transform duration-500 ease-out flex items-center justify-between p-3.5 bg-[#7952F3]/5 backdrop-blur-[1px]"
              style={{ 
                transform: `translateZ(${layerZ.layer3}px)`,
                boxShadow: isExploded ? '0 20px 50px rgba(121,82,243,0.35)' : 'none'
              }}
            >
              <div className="flex items-center gap-1.5 text-purple-200 font-mono text-[9px]">
                <Rotate3d className="w-3.5 h-3.5 animate-spin text-[#7952F3]" style={{ animationDuration: '8s' }} />
                <span>3D MATRIX</span>
              </div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#7952F3] animate-ping" />
            </div>

            {/* Layer 4: Floating Soft Inner Border Frame */}
            <div 
              className="absolute inset-13 border border-white/15 rounded-xl bg-white/5 pointer-events-none transition-transform duration-500 ease-out flex items-end justify-end p-3"
              style={{ transform: `translateZ(${layerZ.layer4}px)` }}
            >
              <span className="text-[8px] font-mono text-purple-200/80 tracking-wider bg-black/40 px-2 py-0.5 rounded-full">
                DEPTH: 4.5CM
              </span>
            </div>

            {/* Layer 5: Main Floating Typography "COMING SOON" */}
            <div 
              className="relative z-20 flex flex-col items-center justify-center space-y-3.5 transition-transform duration-500 ease-out"
              style={{ transform: `translateZ(${layerZ.layer5}px)` }}
            >
              {/* Soft Purple Floating Icon */}
              <motion.div 
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                className="p-3.5 rounded-2xl bg-white/95 border border-white shadow-[0_12px_30px_rgba(121,82,243,0.35)] text-[#4A32B8]"
              >
                <Cube className="w-8 h-8 animate-pulse text-[#7952F3]" />
              </motion.div>

              {/* Main Shimmering Title */}
              <motion.h1 
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="text-3xl sm:text-4xl md:text-5xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-white via-[#EDE8FF] to-[#D0CDE6] font-extrabold tracking-wider drop-shadow-md"
              >
                COMING SOON
              </motion.h1>

              {/* Soft Subtext Capsule */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-white text-[10px] font-semibold text-[#4A32B8] uppercase tracking-[0.2em] shadow-md">
                <Flame className="w-3.5 h-3.5 text-[#7952F3] animate-bounce" />
                <span>PHYSICAL & DIGITAL 3D CANVAS</span>
              </div>
            </div>

          </div>
        </motion.div>
      </div>

      {/* ── Interactive 3D Soft Capsule Controls ── */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-wrap items-center justify-center gap-3 mt-4 relative z-10"
      >
        {/* Toggle 3D Explosion Effect Button */}
        <button
          type="button"
          onClick={() => setIsExploded(!isExploded)}
          className={`px-5 py-2.5 rounded-full font-sans text-xs font-semibold tracking-wide transition-all duration-300 flex items-center gap-2 border cursor-pointer ${
            isExploded
              ? 'bg-[#4A32B8] text-white border-[#4A32B8] shadow-[0_6px_20px_rgba(74,50,184,0.35)]'
              : 'bg-white/90 text-[#373D4D] border-white hover:bg-white hover:text-[#4A32B8] shadow-[0_4px_14px_rgba(180,185,210,0.3)]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{isExploded ? 'Collapse 3D Layers' : 'Explode 3D Layers'}</span>
        </button>

        {/* Toggle Auto Rotation Button */}
        <button
          type="button"
          onClick={() => setIsAutoRotating(!isAutoRotating)}
          className={`px-5 py-2.5 rounded-full font-sans text-xs font-semibold tracking-wide transition-all duration-300 flex items-center gap-2 border cursor-pointer ${
            isAutoRotating
              ? 'bg-[#EDE8FF] text-[#4A32B8] border-white shadow-[0_4px_16px_rgba(121,82,243,0.25)]'
              : 'bg-white/90 text-[#373D4D] border-white hover:bg-white hover:text-[#4A32B8] shadow-[0_4px_14px_rgba(180,185,210,0.3)]'
          }`}
        >
          {isAutoRotating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span>{isAutoRotating ? 'Pause 360° View' : 'Auto Rotate 360°'}</span>
        </button>
      </motion.div>

      {/* Interactive Helper Text */}
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ delay: 0.5 }}
        className="text-[11px] font-medium text-[#62617A] flex items-center gap-2 tracking-wider uppercase mt-5 relative z-10"
      >
        <Compass className="w-3.5 h-3.5 text-[#7952F3] animate-pulse" />
        <span>MOVE CURSOR OVER CANVAS TO ROTATE IN REALTIME 3D</span>
      </motion.p>
    </div>
  );
}
