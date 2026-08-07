import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ExternalLink, 
  Cpu, 
  Compass, 
  Sparkles, 
  Users, 
  Layers, 
  FileText, 
  ShoppingBag, 
  ChevronRight, 
  MapPin, 
  Activity, 
  Database,
  Heart,
  Cuboid as Cube
} from 'lucide-react';
import { Painting, StyleType } from '../types';
import { PAINTINGS } from '../data';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useSwipeDismiss } from '../hooks/useSwipeDismiss';

interface WebsiteMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: 'home' | 'gallery' | 'visualizer' | 'artists' | 'stickers' | 'packs' | 'threed') => void;
  onSelectCategory: (category: StyleType) => void;
  cartCount: number;
  toggleCart: () => void;
}

export default function WebsiteMapModal({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  onSelectCategory,
  cartCount,
  toggleCart
}: WebsiteMapModalProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const { isMobile, isShort } = useBreakpoint();
  useBodyScrollLock(isOpen);
  const { offset, handlers } = useSwipeDismiss({ enabled: isMobile && isOpen, onDismiss: onClose });

  if (!isOpen) return null;

  const navNodes = [
    { 
      id: 'home', 
      title: 'Home Hub', 
      desc: 'Manifesto, 3D Cyborg visualizer, and Siberian wood box logistics.',
      icon: Compass, 
      action: () => { setActiveTab('home'); onClose(); } 
    },
    { 
      id: 'gallery', 
      title: 'Categories & Gallery', 
      desc: 'Browse filtered neural families and original masterpieces.',
      icon: Layers, 
      action: () => { setActiveTab('gallery'); onClose(); } 
    },
    { 
      id: 'visualizer', 
      title: 'Space Simulator', 
      desc: 'Launch real-time custom 1:1 scale framing & wall visualizer.',
      icon: Sparkles, 
      action: () => { setActiveTab('visualizer'); onClose(); } 
    },
    { 
      id: 'artists', 
      title: 'The Artists Guild', 
      desc: 'Biographies, mechanical canvas insights, and oil techniques.',
      icon: Users, 
      action: () => { setActiveTab('artists'); onClose(); } 
    },
    { 
      id: 'threed', 
      title: '3D Painting Atelier', 
      desc: 'Volumetric oil paintings with physical multi-plane depth & sculpted relief.',
      icon: Cube, 
      action: () => { setActiveTab('threed'); onClose(); } 
    },
    { 
      id: 'stickers', 
      title: 'Stickers Workshop', 
      desc: 'Bespoke die-cut vinyl stickers with holographic, matte, and glossy finishes.',
      icon: Sparkles, 
      action: () => { setActiveTab('stickers'); onClose(); } 
    },
    { 
      id: 'packs', 
      title: 'Collector Packs & Bundles', 
      desc: 'Coordinated sticker boxes and painting twin packs with bulk rate discounts.',
      icon: Layers, 
      action: () => { setActiveTab('packs'); onClose(); } 
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-[#EAE9F6]/95 backdrop-blur-2xl flex items-start justify-center p-4 md:p-6 select-none font-sans">
        
        {/* Futuristic Grid Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-25 z-0">
          <div className="absolute top-0 left-1/4 w-[1px] h-full bg-[#7952F3]/40" />
          <div className="absolute top-0 left-2/3 w-[1px] h-full bg-[#7952F3]/40" />
          <div className="absolute top-1/3 left-0 w-full h-[1px] bg-[#7952F3]/40" />
          <div className="absolute top-3/4 left-0 w-full h-[1px] bg-[#7952F3]/40" />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className={isMobile ? 'pz-sheet w-full bg-white/70 border border-[#D0CDE6] p-0 shadow-2xl z-10 flex flex-col justify-between overflow-hidden' : 'relative w-full max-w-5xl bg-white/70 border border-[#D0CDE6] p-6 md:p-10 rounded-[36px] shadow-2xl z-10 flex flex-col justify-between overflow-hidden my-auto'}
          style={isMobile ? { transform: `translateY(${offset}px)` } : undefined}
        >
          {isMobile && <div className="pz-sheet__grip" {...handlers} aria-hidden="true" />}
          
          <div className={isMobile ? `pz-sheet__body ${isShort ? 'p-3' : 'p-6'} flex flex-col` : 'flex flex-col h-full'}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#D0CDE6] pb-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-forest-cream text-white p-2.5 rounded-2xl shadow-md">
                <Cpu className="w-5 h-5 text-[#7952F3] animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-black text-forest-cream tracking-tight uppercase">
                  Cyberspace Map
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={onClose}
                className="p-2 hover:bg-forest-cream/10 text-forest-cream rounded-full transition-all cursor-pointer border border-[#D0CDE6]"
                aria-label="Close Map"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Grid Layout of Map */}
          <div className="flex flex-col items-center justify-center max-w-2xl mx-auto w-full gap-8">
            
            {/* Active Interactive Navigation Nodes */}
            <div className="w-full space-y-4">
              
              <div className="space-y-3">
                {navNodes.map((node) => {
                  const IconComp = node.icon;
                  const isActive = activeTab === node.id;
                  return (
                    <div
                      key={node.id}
                      onClick={node.action}
                      onMouseEnter={() => setHoveredNode(node.id)}
                      onMouseLeave={() => setHoveredNode(null)}
                      className={`group flex items-start gap-4 p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
                        isActive 
                          ? 'bg-forest-cream text-white border-forest-cream shadow-lg' 
                          : 'bg-white/45 hover:bg-white/90 border-[#D0CDE6] text-forest-cream'
                      }`}
                    >
                      <div className={`p-2.5 rounded-xl ${isActive ? 'bg-[#7952F3] text-white' : 'bg-forest-cream/5 text-forest-cream'}`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-extrabold tracking-tight">
                            {node.title}
                          </h4>
                          {isActive && (
                            <span className="text-[8px] font-mono font-bold bg-[#7952F3] text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Current Node
                            </span>
                          )}
                        </div>
                        <p className={`text-[11px] mt-1 leading-normal ${isActive ? 'text-white/80' : 'text-forest-sage'}`}>
                          {node.desc}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 self-center text-forest-sage/50 group-hover:translate-x-1 transition-transform" />
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

            {/* Footer of the Map */}
            <div className={isMobile ? 'pz-sheet__footer border-t border-[#D0CDE6] mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-mono text-forest-sage font-semibold' : 'border-t border-[#D0CDE6] mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-mono text-forest-sage font-semibold'}>
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#7952F3]" />
                <span>NN CYBERSPACE NET // MAP VER 4.8</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <span>Crafted with</span>
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" />
                <span>for client interactive experience.</span>
              </div>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
