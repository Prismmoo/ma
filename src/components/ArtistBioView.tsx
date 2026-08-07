import React from 'react';
import { ARTISTS } from '../data';
import { MapPin, ShieldCheck, Award, Heart, Play, Sparkles } from 'lucide-react';
import ArtistPortrait from './ArtistPortrait';

export default function ArtistBioView() {
  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 space-y-24">
      {/* Editorial Page Header */}
      <section className="text-center max-w-3xl mx-auto">
        <span className="text-[10px] font-sans tracking-[0.25em] uppercase text-forest-gold font-bold">
          Qui sommes-nous?
        </span>
        <h1 className="font-serif text-4xl lg:text-5xl tracking-tight mt-3 text-forest-cream font-bold">
          Meet the Artists
        </h1>
        <p className="font-serif italic text-lg text-forest-cream/80 mt-4">
          Uncompromising independent European masters redefining texture, calligraphy, and silent spaces.
        </p>
        <div className="w-20 h-[1px] bg-forest-sage/20 mx-auto mt-8" />
      </section>

      {/* Artists Story List */}
      <section className="space-y-20">
        {ARTISTS.map((artist, idx) => (
          <div 
            key={artist.id}
            className={`grid grid-cols-1 lg:grid-cols-12 gap-12 items-center ${
              idx % 2 === 1 ? 'lg:flex-row-reverse' : ''
            }`}
          >
            {/* Portrait Image */}
            <ArtistPortrait artist={artist} reversed={idx % 2 === 1} />

            {/* Artist Story details */}
            <div className="lg:col-span-8 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 text-forest-gold text-xs font-mono tracking-wider uppercase">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{artist.location}</span>
                </div>
                
                <h2 className="font-serif text-3xl lg:text-4xl tracking-tight text-forest-cream font-bold">
                  {artist.name}
                </h2>
              </div>

              <blockquote className="border-l-2 border-forest-gold pl-4 italic font-serif text-base text-forest-cream/80 py-1">
                {artist.philosophy}
              </blockquote>

              <div className="space-y-4 text-xs text-forest-cream/70 leading-relaxed font-sans">
                <p>{artist.bio}</p>
              </div>

              <div className="pt-4 flex flex-wrap items-center gap-6 text-[10px] uppercase font-mono tracking-wider text-forest-gold">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-forest-gold" />
                  <span>100% Raw Flax Linen Canvas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-red-400" />
                  <span>Sustainably Sourced Wood stretchers</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Core Gallery Manifesto */}
      <section className="bg-forest-deep border border-forest-sage/20 p-10 lg:p-16 max-w-4xl mx-auto shadow-sm text-center space-y-6">
        <span className="text-[10px] font-sans tracking-[0.25em] uppercase text-forest-gold font-bold">
          Notre Manifesto
        </span>
        <h2 className="font-serif text-2xl lg:text-3xl tracking-tight text-forest-cream font-bold">
          The Silence of the Canvas
        </h2>
        
        <p className="text-xs text-forest-cream/70 leading-relaxed font-sans max-w-2xl mx-auto">
          Maison d'Art is founded on a singular conviction: that physical oil-and-pigment paintings carry a volumetric presence that digital prints can never mimic. By curating a select group of independent European masters and equipping them with absolute creative freedom, we preserve the heritage of fine materials—marble dust plaster, raw linen, and burnished clay—for the modern home. We invite you to live with silence, texture, and light.
        </p>
        
        <div className="text-xs font-mono text-forest-gold uppercase tracking-widest pt-4">
          MESROUR SALAH EDDINE &bull; NOUREDDIN EL MOBARAKI
        </div>
      </section>

      {/* The PRISM Philosophy & Video Section */}
      <section className="max-w-4xl mx-auto mt-20 pt-16 border-t border-forest-sage/20 space-y-12">
        <div className="text-center space-y-4">
          <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-forest-gold font-bold">
            [ ESTABLISHED IN REFRACTION ]
          </span>
          <h2 className="font-serif text-3xl lg:text-4xl tracking-tight text-forest-cream font-bold">
            The PRISM Philosophy
          </h2>
          <p className="text-sm text-forest-cream/80 max-w-2xl mx-auto leading-relaxed font-serif italic">
            PRISM is more than light reflection—it is our manifesto of perception, refraction, and raw chromatic energy. We do not just craft stickers; we build micro-canvases designed to bend ambient light, transforming everyday gear into high-octane physical portals.
          </p>
        </div>

        {/* Video Placeholder Area */}
        <div className="relative aspect-video rounded-[32px] overflow-hidden border border-white/10 bg-white/5 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center group transition-all duration-300 hover:border-forest-gold/30">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(121,82,243,0.15)_0%,transparent_70%)] pointer-events-none" />
          
          <div className="relative z-10 space-y-4">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto border border-white/25 group-hover:scale-105 group-hover:bg-[#7952F3]/20 group-hover:border-[#7952F3]/50 transition-all duration-300">
              <Play className="w-6 h-6 text-forest-cream ml-1 group-hover:text-white transition-colors" />
            </div>
            
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold tracking-widest text-forest-gold uppercase block">
                REFRACTIVE TEST STREAM INCOMING
              </span>
              <p className="text-xs text-forest-sage max-w-sm mx-auto">
                A custom high-definition visual feature showcasing the holographic refraction vectors and adhesive endurance benchmarks.
              </p>
            </div>
          </div>

          <div className="absolute bottom-4 right-4 text-[9px] font-mono text-forest-cream/40 uppercase tracking-widest">
            [ VIDEO INSTANCE BUFFER ]
          </div>
        </div>
      </section>
    </div>
  );
}
