import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  ShieldCheck, 
  Truck, 
  Palette, 
  ArrowRight, 
  Eye, 
  Play, 
  ArrowDownRight, 
  Workflow
} from 'lucide-react';
import { Painting, StyleType } from '../types';
import { formatMAD } from '../lib/pricing';
import { useHeroMedia } from '../hooks/useHeroMedia';

interface HeroSectionProps {
  onExploreGallery: () => void;
  onTryVisualizer: () => void;
  featuredPaintings: Painting[];
  onSelectPainting: (painting: Painting) => void;
  setActiveTab: (tab: 'home' | 'gallery' | 'visualizer' | 'artists') => void;
  onSelectCategory?: (category: StyleType) => void;
  showAllContent?: boolean;
  onExploreCategoriesClick?: () => void;
}

const CATEGORIES: {
  id: string;
  name: StyleType;
  type: 'AI Digital' | 'Virtual Reality' | 'Neural Fine Art';
  tagline: string;
  desc: string;
  imageUrl: string;
}[] = [
  {
    id: 'cat-1',
    name: 'Abstract',
    type: 'Neural Fine Art',
    tagline: 'GEN-2 LATENT FLOWS',
    desc: 'Deep latent noise variables mapped to high-fidelity canvas colors, creating gorgeous liquid-metal-inspired organic storms.',
    imageUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'cat-2',
    name: 'Minimalist',
    type: 'AI Digital',
    tagline: 'PRECISE RESTRICTION',
    desc: 'Neoclassical line work over pure pastel gradients. Perfect studies in restrained high-tech space harmony.',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'cat-3',
    name: 'Textured',
    type: 'Neural Fine Art',
    tagline: 'TACTILE CIRCUITRY',
    desc: '3D micro-relief textures, semiconductor-inspired silicon layering, and synthetic minerals fused on canvas.',
    imageUrl: 'https://images.unsplash.com/photo-1580136579312-94651dfd596d?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'cat-4',
    name: 'Contemporary',
    type: 'Virtual Reality',
    tagline: 'CYBERSPACE ARCHITECTURE',
    desc: 'Complex geometry-guided virtual structures rendered onto premium matte-wash surfaces to capture digital depth.',
    imageUrl: 'https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'cat-5',
    name: 'Anime',
    type: 'AI Digital',
    tagline: 'JAPANESE NEON AESTHETIC',
    desc: 'Vibrant cell-shaded cyber artwork inspired by futuristic cyberpunk metropolis landscapes and vivid characters.',
    imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'cat-6',
    name: 'Gaming',
    type: 'Virtual Reality',
    tagline: 'INTERACTIVE VIRTUAL WORLDS',
    desc: 'Hyper-detailed gaming environments and neural worldscapes captured on museum-grade canvas.',
    imageUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'cat-7',
    name: 'Films',
    type: 'AI Digital',
    tagline: 'CINEMATIC ATMOSPHERES',
    desc: 'Widescreen cinematic stills and dramatic lighting compositions produced with neural scene generators.',
    imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'cat-8',
    name: 'Motorbikes',
    type: 'Neural Fine Art',
    tagline: 'HIGH SPEED AUTOMOTIVE',
    desc: 'Sleek metallic lines and aerodynamic velocity captured in high-contrast chrome and asphalt textures.',
    imageUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'cat-9',
    name: 'Cars',
    type: 'Neural Fine Art',
    tagline: 'AUTOMOTIVE DESIGN & SPEED',
    desc: 'Supercar silhouettes and futuristic vehicle concepts rendered with glossy reflections and raw horsepower aesthetics.',
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'cat-10',
    name: 'Impressionist',
    type: 'Neural Fine Art',
    tagline: 'MODERN IMPRESSIONISM',
    desc: 'Luminous brushstrokes and expressive color harmonies blending classic techniques with digital light synthesis.',
    imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&q=80&w=600'
  }
];

export default function HeroSection({
  onExploreGallery,
  onTryVisualizer,
  featuredPaintings,
  onSelectPainting,
  setActiveTab,
  onSelectCategory,
  showAllContent = false,
  onExploreCategoriesClick
}: HeroSectionProps) {
  const [filterType, setFilterType] = useState<'All' | 'AI Digital' | 'Virtual Reality' | 'Neural Fine Art'>('All');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState('');

  const { heroVideoRef, showVideo, videoReady, videoFailed, triggerReveal, isMobile } = useHeroMedia({
    isTransitioning: false,
    onExploreGallery: () => {
      onExploreGallery();
    },
  });

  const filteredCategories = CATEGORIES.filter(
    cat => filterType === 'All' || cat.type === filterType
  );

  const startDemoGeneration = () => {
    setIsGenerating(true);
    setGenerationProgress('Connecting to Neural Grid...');
    setTimeout(() => {
      setGenerationProgress('Synthesizing semiconductor particles...');
      setTimeout(() => {
        setGenerationProgress('Rendering cyber portrait mesh...');
        setTimeout(() => {
          setIsGenerating(false);
          setGenerationProgress('');
          // Select tab
          setActiveTab('gallery');
        }, 800);
      }, 800);
    }, 800);
  };

  const handleExploreCategories = () => {
    if (showAllContent) {
      if (onExploreCategoriesClick) {
        onExploreCategoriesClick();
      }
      setTimeout(() => {
        const element = document.getElementById('collections-section');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      onExploreGallery();
    }
  };

  return (
    <div className={`${showAllContent ? 'space-y-24 pb-24 bg-gradient-to-b from-[#EAE9F6] via-[#EAE9F6] to-[#ECEBFA]' : 'h-full w-full overflow-hidden bg-forest-black'} overflow-x-hidden relative`}>
      
      {/* 1. FUTURISTIC HERO LANDING DESIGN */}
      <section className="nn-hero-viewport relative w-full flex flex-col justify-between px-4 md:px-12 pt-6 pb-12 overflow-hidden select-none">
        
        {/* Background Video */}
        {showVideo && (
          <video
            ref={heroVideoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
            disableRemotePlayback
            controls={false}
            tabIndex={-1}
            aria-hidden="true"
            className={`nn-hero-background-video absolute inset-0 z-0 h-full w-full object-cover transition-all duration-700 ease-out ${
              videoReady ? 'opacity-100' : 'opacity-0'
            } scale-100`}
          >
            <source
              src="https://noureddinelmobaraki-web.github.io/nl-audio-cdn/lu.bg.webm"
              type="video/webm"
            />
            {/* ارفع نسخة H.264 بجانب الـwebm وأزل التعليق — Safari لا يفكّ VP9 بثقة.
            <source
              src="https://noureddinelmobaraki-web.github.io/nl-audio-cdn/lu.bg.mp4"
              type="video/mp4"
            /> */}
          </video>
        )}

        {/* قاعدة صلبة تحت الفيديو. لون الثيم فقط — لا صورة، لا تدرّج، لا لوحة.
            دائمة لا شرطية: تغطّي لحطة ما قبل أول إطار، وتغطّي الفشل الحقيقي،
            بنفس البكسل، فلا يوجد مسار يعرض فراغًا. */}
        {showVideo && (
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 h-full w-full bg-forest-black"
          />
        )}

        {/* Ambient background blur */}
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-[#C084FC]/10 rounded-full blur-[140px] pointer-events-none animate-pulse duration-[10000ms]" />



        {/* UPPER MAIN LAYOUT: Hero content, central visual, floating cards */}
        <div className="max-w-7xl mx-auto w-full flex flex-col items-center justify-center flex-1 relative z-10 pt-4">
        </div>



      </section>

      {showAllContent && (
        <>

      {/* 2. ARTWORK CATEGORIES SECTION */}
      <section className="max-w-7xl mx-auto px-4 md:px-12" id="collections-section">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <h2 className="font-sans text-3xl lg:text-4xl tracking-tight text-forest-cream font-extrabold">
              Explore Categories
            </h2>
          </div>
          <p className="font-sans text-xs text-forest-sage font-medium max-w-md leading-relaxed">
            Select an art category below to filter our physical and neural artwork collection. Each category features curated pieces designed to transform your space.
          </p>
        </div>



        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredCategories.map((cat) => (
            <div 
              key={cat.id}
              onClick={() => {
                if (onSelectCategory) {
                  onSelectCategory(cat.name);
                } else {
                  setActiveTab('gallery');
                }
              }}
              className="group border border-white/60 p-5 bg-white/45 backdrop-blur-md rounded-3xl flex flex-col justify-between hover:border-forest-gold hover:shadow-xl transition-all duration-500 cursor-pointer hover:-translate-y-1"
            >
              <div>
                <div className="aspect-[4/3] overflow-hidden mb-4 bg-forest-cream/5 rounded-2xl relative border border-white/50">
                  <img 
                    src={cat.imageUrl} 
                    alt={`${cat.name} Category`} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2.5 right-2.5 bg-forest-cream text-white px-2.5 py-0.5 text-[8px] font-mono tracking-wider uppercase rounded-full">
                    {cat.type}
                  </div>
                </div>
                <span className="text-[9px] font-mono tracking-widest uppercase text-[#7952F3] font-bold">{cat.tagline}</span>
                <h3 className="font-sans text-lg tracking-tight text-forest-cream mt-1 group-hover:text-forest-gold transition-colors font-extrabold">
                  {cat.name}
                </h3>
              </div>
              
              <div className="mt-5 pt-3 border-t border-forest-dark/30 flex items-center justify-between text-[10px] font-mono tracking-wider uppercase font-bold text-forest-cream group">
                <span className="group-hover:text-[#7952F3] transition-colors">Explore Category</span>
                <ArrowRight className="w-3.5 h-3.5 text-forest-sage transform group-hover:translate-x-1 group-hover:text-[#7952F3] transition-all" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. CURATOR'S ROTATING FUTURISTIC SELECTION */}
      <section className="bg-white/30 border-y border-white/50 backdrop-blur-md py-20 px-4 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 text-center max-w-xl mx-auto">
            <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-[#7952F3] font-bold bg-[#7952F3]/10 px-3 py-1 rounded-full">
              Verified Artworks
            </span>
            <h2 className="font-sans text-3xl lg:text-4xl tracking-tight text-forest-cream mt-4 font-extrabold">
              Featured Masterpieces
            </h2>
            <div className="w-12 h-1 bg-[#7952F3] mx-auto mt-4 rounded-full" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
            {featuredPaintings.slice(0, 3).map((painting) => (
              <div 
                key={painting.id}
                onClick={() => onSelectPainting(painting)}
                className="group cursor-pointer flex flex-col space-y-4 bg-white/45 border border-white/50 p-5 rounded-[32px] hover:shadow-xl transition-all duration-500 hover:-translate-y-1"
              >
                <div 
                  className={`w-full bg-forest-cream/5 rounded-[24px] border border-white/50 flex items-center justify-center relative overflow-hidden transition-all duration-500 group-hover:border-[#7952F3]/40 ${
                    painting.sizeCategory === 'Small' ? 'p-4' :
                    painting.sizeCategory === 'Medium' ? 'p-6' :
                    painting.sizeCategory === 'Large' ? 'p-8' :
                    'p-10'
                  }`}
                >
                  <img 
                    src={painting.imageUrl} 
                    alt={painting.title} 
                    className="w-full h-auto object-contain shadow-xl group-hover:scale-[1.02] transition-transform duration-700 rounded-lg"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-4 left-4 bg-forest-cream text-white px-3 py-1 rounded-full text-[10px] font-mono tracking-wider uppercase">
                    {painting.widthCm}x{painting.heightCm} cm
                  </div>
                </div>
                
                <div className="flex justify-between items-start pt-1">
                  <div>
                    <h3 className="font-sans text-base text-forest-cream group-hover:text-[#7952F3] transition-colors font-extrabold">
                      {painting.title}
                    </h3>
                    <p className="text-xs text-forest-sage font-medium mt-0.5">
                      by {painting.artistName}
                    </p>
                  </div>
                  <span className="font-mono text-xs font-bold text-white bg-forest-cream px-3 py-1.5 rounded-full">
                    {formatMAD(painting.price)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. VISUALIZER INTERACTIVE PITCH (THE WALL) */}
      <section className="max-w-7xl mx-auto px-4 md:px-12">
        <div className="bg-white/45 backdrop-blur-md border border-white/60 rounded-[40px] grid grid-cols-1 lg:grid-cols-2 overflow-hidden shadow-xl">
          <div className="p-10 lg:p-16 flex flex-col justify-center space-y-6">
            <div className="flex items-center gap-1.5 text-[#7952F3] font-mono text-xs tracking-wider uppercase font-bold bg-[#7952F3]/10 self-start px-3 py-1 rounded-full">
              <Sparkles className="w-4 h-4" />
              <span>Interactive Space Simulator</span>
            </div>
            
            <h2 className="font-sans text-3xl lg:text-5xl tracking-tight leading-[1.1] text-forest-cream font-extrabold">
              Your Real Walls,<br /> Meticulously Simulated.
            </h2>
            
            <p className="text-xs text-forest-sage font-medium leading-relaxed max-w-md">
              To eliminate the abstract fear of buying canvas scales online, our interactive <strong>View in Room</strong> simulator engine maps original physical dimensions to virtual spaces perfectly in real-time.
            </p>
            
            <ul className="text-xs text-forest-cream font-medium space-y-3 pt-2">
              <li className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 bg-[#7952F3] rounded-full" />
                <span>Simulate exact physical size relative to furniture (1cm = 0.8px physics)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 bg-[#7952F3] rounded-full" />
                <span>Customize bespoke high-tech frames, minimalist matte finishes, and gold plates</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 bg-[#7952F3] rounded-full" />
                <span>Adjust lighting parameters (Evening warmth, Studio spot, Daylight)</span>
              </li>
              <li className="flex items-center gap-2.5 font-bold text-[#7952F3]">
                <span className="w-1.5 h-1.5 bg-[#7952F3] rounded-full animate-ping" />
                <span>Drag & drop anywhere, or upload a photo of your own wall!</span>
              </li>
            </ul>

            <div className="pt-4">
              <button
                onClick={onTryVisualizer}
                className="bg-forest-cream text-white hover:bg-[#7952F3] text-xs font-bold tracking-wider uppercase px-8 py-4 rounded-2xl transition-all duration-300 cursor-pointer shadow-md"
              >
                Launch Simulator
              </button>
            </div>
          </div>

          <div className="relative h-96 lg:h-auto min-h-[400px] bg-forest-cream/5 flex items-center justify-center p-8 border-t lg:border-t-0 lg:border-l border-white/45">
            {/* Visual preview of simulated room */}
            <div className="absolute inset-0 bg-cover bg-center opacity-40 bg-[url('https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=1000')]" />
            
            {/* Overlay simulation showcase */}
            <div className="relative bg-white/80 border-[6px] border-[#7952F3] p-4 rounded-3xl shadow-2xl max-w-xs transform -rotate-2 hover:rotate-0 transition-all duration-500 hover:scale-105 z-10 cursor-pointer" onClick={onTryVisualizer}>
              <img 
                src="https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=400" 
                alt="Simulated Painting" 
                className="w-48 h-40 object-cover rounded-xl"
                referrerPolicy="no-referrer"
              />
              <p className="text-[10px] font-mono text-center text-forest-cream/60 mt-3 uppercase tracking-widest font-bold">
                L'Éther Doré (120x100 cm)
              </p>
            </div>

            <div className="absolute top-4 right-4 bg-white/90 border border-white px-3.5 py-1.5 rounded-full text-[9px] font-mono font-bold tracking-wider text-[#7952F3] uppercase">
              Live Mockup Preview
            </div>
          </div>
        </div>
      </section>

      {/* 4.5 THE PHILOSOPHY OF THIS WEBSITE, PRODUCTS & SERVICES */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-16 space-y-12">
        <div className="w-16 h-[1px] bg-forest-sage/20 mx-auto" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Block: Philosophy Manifesto */}
          <div className="lg:col-span-5 space-y-6">
            <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-forest-gold font-bold">
              [ REFRACTED VISION ]
            </span>
            <h2 className="font-serif text-3xl lg:text-4xl tracking-tight text-forest-cream font-bold leading-tight">
              The Philosophy of This Website
            </h2>
            <div className="w-12 h-[2px] bg-[#7952F3]" />
            <p className="text-sm text-forest-sage leading-relaxed font-serif italic">
              "We believe that original artistic vision should not remain trapped behind glowing glass screens. It deserves to be materialized, scaled, and integrated directly into the physical environments we inhabit."
            </p>
            <p className="text-xs text-forest-sage/90 leading-relaxed font-medium">
              This digital space acts as a refractive prism: a meeting ground where complex generative models, digital craftsmanship, and physical, tactile materials converge. Every masterpiece featured is created as a high-density sensory artifact, bridging the gap between mathematical latent spaces and traditional art collectors.
            </p>
          </div>

          {/* Right Block: Products & Services Breakdown */}
          <div className="lg:col-span-7 bg-white/45 border border-white/60 p-8 rounded-[36px] backdrop-blur-md space-y-6">
            <div className="space-y-1">
              <span className="text-[9px] font-mono tracking-widest text-[#7952F3] font-bold uppercase">
                [ ATELIER FRAMEWORKS ]
              </span>
              <h3 className="font-sans text-lg tracking-tight text-forest-cream font-extrabold">
                Bespoke Products & Services
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Product Card */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-forest-gold uppercase tracking-wider font-bold block">
                  01 / Premium Products
                </span>
                <p className="text-xs text-forest-sage leading-relaxed font-medium">
                  From high-density original giclée canvases to laser-cut holographic prism stickers, we produce tangible high-fidelity hardware. Each piece is crafted using heavy-gauge archival paper, high-pigment UV ink, and hand-milled Siberian wood framing.
                </p>
              </div>

              {/* Service Card */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-forest-gold uppercase tracking-wider font-bold block">
                  02 / Digital Services
                </span>
                <p className="text-xs text-forest-sage leading-relaxed font-medium">
                  We supply collectors with absolute spatial certainty. Use our interactive live-room simulator to scale art previews on physical walls, coordinate dimensions down to the millimeter, and receive hand-signed wax-sealed provenance certificates with every transit.
                </p>
              </div>

            </div>

            <div className="border-t border-forest-sage/20 pt-4 flex flex-wrap gap-4 items-center justify-between">
              <span className="text-[10px] font-mono text-forest-sage/70">
                A perfect union of code, canvas, and carbon.
              </span>
              <button 
                onClick={onExploreGallery}
                className="inline-flex items-center gap-2 text-[10px] font-mono font-bold tracking-widest text-[#7952F3] uppercase hover:text-forest-cream transition-colors duration-300"
              >
                <span>Browse original paintings</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* 5. TRUST SIGNALS & PROVENANCE */}
      <section className="max-w-7xl mx-auto px-4 md:px-12">
        <div className="border border-white/60 bg-white/45 backdrop-blur-md rounded-[32px] divide-y md:divide-y-0 md:divide-x divide-forest-dark/30 grid grid-cols-1 md:grid-cols-3">
          <div className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-forest-cream text-white flex items-center justify-center mx-auto shadow-md">
              <Truck className="w-5 h-5" />
            </div>
            <h3 className="font-sans text-base tracking-tight text-forest-cream font-extrabold">
              Bespoke Transit Pods
            </h3>
            <p className="text-xs text-forest-sage leading-relaxed max-w-xs mx-auto font-medium">
              Every canvas is nested in high-density anti-shock foam and encased inside a custom-built Siberian Pine container constructed by master woodworkers.
            </p>
          </div>

          <div className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-forest-cream text-white flex items-center justify-center mx-auto shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-sans text-base tracking-tight text-forest-cream font-extrabold">
              Certified Tokenized Provenance
            </h3>
            <p className="text-xs text-forest-sage leading-relaxed max-w-xs mx-auto font-medium">
              Shipped with a formal, hand-wax-sealed Certificate of Authenticity specifying chemistry, origin, and the signature of both artist and neural system.
            </p>
          </div>

          <div className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-forest-cream text-white flex items-center justify-center mx-auto shadow-md">
              <Palette className="w-5 h-5" />
            </div>
            <h3 className="font-sans text-base tracking-tight text-forest-cream font-extrabold">
              Artisanal Master Frames
            </h3>
            <p className="text-xs text-forest-sage leading-relaxed max-w-xs mx-auto font-medium">
              Choose Raw Oak, Matte Charcoal Black wood, or 22k burnished gold-leaf gilded brass frames, carefully built-to-order inside our private workshop.
            </p>
          </div>
        </div>
      </section>
        </>
      )}
    </div>
  );
}
